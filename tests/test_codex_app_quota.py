import concurrent.futures
import json
import os
import tempfile
import time
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

import codex_app_quota as quota


class CodexAppQuotaTest(unittest.TestCase):
    def setUp(self):
        quota.stop_codex_cli_quota()
        self.addCleanup(quota.stop_codex_cli_quota)
        fixture = tempfile.TemporaryDirectory()
        self.addCleanup(fixture.cleanup)
        self.dir = Path(fixture.name).resolve()

    def fake(self, source):
        path = self.dir / "codex"
        import sys
        path.write_text("#!" + sys.executable + "\n" + source)
        path.chmod(0o755)
        return path

    def wait_for(self, predicate):
        until = time.monotonic() + 2
        while time.monotonic() < until:
            result = quota.peek_codex_app_quota()
            if predicate(result):
                return result
            time.sleep(.015)
        self.fail("quota snapshot did not reach expected state")

    def test_transport_no_browser_start_one_cli_and_exact_real_weekly(self):
        launch_file = self.dir / "launches"
        exe = self.fake(f'''
import json, os, pathlib, sys, time
assert sys.argv[1:] == {list(quota.APP_SERVER_ARGS)!r}
assert "OPENAI_API_KEY" not in os.environ and "OTEL_EXPORTER_OTLP_ENDPOINT" not in os.environ
assert pathlib.Path(os.environ["CODEX_HOME"]) == pathlib.Path({str(self.dir)!r})
assert not list(pathlib.Path.cwd().iterdir())
pathlib.Path({str(launch_file)!r}).open("a").write("x")
def read(): return json.loads(sys.stdin.readline())
def write(x): print(json.dumps(x), flush=True)
r = read()
assert r["method"] == "initialize" and r["id"] == 1
write({{"id": 1, "result": {{"userAgent":"fake"}}}})
assert read() == {{"method": "initialized", "params": {{}}}}
assert read() == {{"id": 2, "method": "account/rateLimits/read"}}
write({{"id": 2, "method":"account/chatgptAuthTokens/refresh","params":{{}}}})
time.sleep(.12)
write({{"id": 2, "result": {{"rateLimits": {{
 "limitId":"codex", "primary":None,
 "secondary":{{"usedPercent":5,"windowDurationMins":10080,"resetsAt":int(time.time()) + 99}},
 "credits":{{"account":"sensitive"}}
}}}}}})
''')
        with patch.object(quota, "_find_codex", return_value=exe), patch.dict(os.environ, {
                "CODEX_HOME": str(self.dir), "OPENAI_API_KEY": "synthetic", "OTEL_EXPORTER_OTLP_ENDPOINT": "synthetic"}):
            self.assertEqual(quota.peek_codex_app_quota()["status"]["state"], "disabled")
            self.assertFalse(launch_file.exists())
            reads = [0]
            real_read = quota.os.read
            def spurious_read(fd, count):
                # The subprocess machinery reads its own exec-error pipe;
                # affect only our quota worker's 8192-byte response reads.
                if count == 8192 and reads[0] == 0:
                    reads[0] += 1
                    raise BlockingIOError(35, "spurious nonblocking wakeup")
                return real_read(fd, count)
            with patch.object(quota.os, "read", side_effect=spurious_read):
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    states = list(pool.map(lambda _: quota.fetch_codex_cli_quota(True)["status"]["state"], range(10)))
                self.assertEqual(set(states), {"loading"})
                data = self.wait_for(lambda r: r["quota"] is not None)
                self.assertEqual(reads[0], 1)
            self.assertIsNone(data["quota"]["primary"])
            self.assertEqual(100 - data["quota"]["secondary"]["used_percent"], 95)
            self.assertEqual(data["quota"]["secondary"]["window_minutes"], 10080)
            self.assertNotIn("credits", data["quota"])
            self.assertEqual(quota.fetch_codex_cli_quota(True)["status"]["state"], "cached")
            self.assertEqual(launch_file.read_text(), "x")
            quota.fetch_codex_cli_quota(False)
            self.assertIsNone(quota.peek_codex_app_quota()["quota"])

    def test_resolve_homebrew_cask_and_reject_external_symlink_or_wrapper(self):
        prefix = self.dir / "homebrew"
        bin_dir = prefix / "bin"
        bin_dir.mkdir(parents=True)
        target = prefix / "Caskroom/codex/1/bin/codex"
        target.parent.mkdir(parents=True)
        target.write_bytes(b"\xcf\xfa\xed\xfe")
        target.chmod(0o755)
        link = bin_dir / "codex"
        link.symlink_to(target)
        self.assertEqual(quota._resolve_homebrew(prefix), target)
        target.parent.chmod(0o775)
        with patch.object(quota,"_homebrew_admin_gid",return_value=None):
            self.assertIsNone(quota._resolve_homebrew(prefix))
        with patch.object(quota,"_homebrew_admin_gid",return_value=target.parent.stat().st_gid):
            self.assertEqual(quota._resolve_homebrew(prefix), target)
        target.parent.chmod(0o777)
        self.assertIsNone(quota._resolve_homebrew(prefix))
        target.parent.chmod(0o755)
        out = self.dir / "other"
        out.write_bytes(b"\xcf\xfa\xed\xfe")
        out.chmod(0o755)
        link.unlink()
        link.symlink_to(out)
        self.assertIsNone(quota._resolve_homebrew(prefix))
        link.unlink()
        link.write_text("#!/bin/sh\nexit 0\n")
        link.chmod(0o755)
        self.assertIsNone(quota._resolve_homebrew(prefix))

    def test_bounded_cancel_and_no_late_cache(self):
        hit = self.dir / "running"
        exe = self.fake(f"import pathlib,time\npathlib.Path({str(hit)!r}).touch()\ntime.sleep(30)\n")
        with patch.object(quota, "_find_codex", return_value=exe):
            quota.fetch_codex_cli_quota(True)
            deadline = time.monotonic() + 1
            while not hit.exists() and time.monotonic() < deadline:
                time.sleep(.01)
            self.assertTrue(hit.exists())
            quota.stop_codex_cli_quota()
            self.assertIsNone(quota._pending)
            self.assertEqual(quota.peek_codex_app_quota()["status"]["state"], "disabled")
        with tempfile.TemporaryDirectory() as cwd:
            result = quota._probe(exe, cwd, {}, threading.Event(), .12)
        self.assertEqual(result["status"]["reason"], "cli_timeout")

    def test_parse_no_conflation_zero_expiry_and_invalid_profile(self):
        def b(p, t):
            return {"usedPercent": p, "windowDurationMins": 10080, "resetsAt": t}
        generic = {"limitId":"codex","primary":b(0,200),"secondary":b(5,300)}
        special = {"limitId":"codex_special","primary":b(55,300)}
        data = {"rateLimitsByLimitId":{"codex":generic},"rateLimits":special}
        self.assertEqual(quota.parse_rate_limits(data, 100)["primary"]["used_percent"], 0)
        self.assertEqual(quota.parse_rate_limits(data, 100)["secondary"]["used_percent"], 5)
        self.assertIsNone(quota.parse_rate_limits(data, 201)["primary"])
        self.assertIsNone(quota.parse_rate_limits({"rateLimits":special}, 100))
        self.assertIsNone(quota.parse_rate_limits(data, 301))
        with patch.dict(os.environ, {"CODEX_HOME":"relative"}):
            self.assertIsNone(quota.codex_cli_home())


if __name__ == "__main__":
    unittest.main()
