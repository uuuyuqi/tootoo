import concurrent.futures
import json
import os
import struct
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
        env = patch.dict(os.environ, {"TOOTOO_HOME": str(self.dir / "state"), "CODEX_HOME": str(self.dir)})
        env.start()
        self.addCleanup(env.stop)

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

    def test_group_cleanup_failure_does_not_discard_valid_quota(self):
        exe = self.fake('''import json, sys
def send(x):
    print(json.dumps(x), flush=True)
json.loads(sys.stdin.readline())
send({"id":1,"result":{}})
json.loads(sys.stdin.readline())
json.loads(sys.stdin.readline())
send({"id":2,"result":{"rateLimits":{"limitId":"codex","primary":None,
      "secondary":{"usedPercent":5,"windowDurationMins":10080,"resetsAt":None}}}})
''')
        with patch.object(quota.os, "killpg", side_effect=PermissionError(1, "group cleanup denied")):
            result = quota._probe(exe, str(self.dir), {}, threading.Event(), timeout=2)
        self.assertEqual(result["status"]["state"], "live")
        self.assertEqual(result["quota"]["secondary"]["used_percent"], 5)

    def make_npm(self, machine, layout, *, nested):
        npm_arch, triple, cpu = quota._NPM_ARCH[machine]
        prefix = self.dir / (machine + ("-nested" if nested else "-flat"))
        modules = prefix / "lib/node_modules/@openai"
        root = modules / "codex"
        (root / "bin").mkdir(parents=True)
        launcher = root / "bin/codex.js"
        launcher.write_text('#!/usr/bin/env node\nthrow "wrapper must not run";\n')
        (prefix / "bin").mkdir()
        (prefix / "bin/codex").symlink_to("../lib/node_modules/@openai/codex/bin/codex.js")
        version = "0.172.0" if layout.startswith("bin") else "0.120.0"
        dep = f"codex-darwin-{npm_arch}"
        binary_version = f"{version}-darwin-{npm_arch}"
        (root / "package.json").write_text(json.dumps({
            "name": "@openai/codex", "version": version, "bin": {"codex": "bin/codex.js"},
            "optionalDependencies": {f"@openai/{dep}": f"npm:@openai/codex@{binary_version}"},
        }))
        native = (root / "node_modules/@openai" if nested else modules) / dep
        binary = native / "vendor" / triple / layout
        binary.parent.mkdir(parents=True)
        (native / "package.json").write_text(json.dumps({
            "name": "@openai/codex", "version": binary_version, "os": ["darwin"], "cpu": [npm_arch],
        }))
        binary.write_bytes(self.macho(cpu))
        binary.chmod(0o755)
        return prefix, root, native, binary

    @staticmethod
    def macho(cpu, kind=2):
        return struct.pack("<8I", 0xFEEDFACF, cpu, 0, kind, 0, 0, 0, 0)

    def test_npm_nested_arm64_and_hoisted_x64_legacy_use_native_only(self):
        for machine, layout, nested in (("arm64", "bin/codex", True), ("x86_64", "codex/codex", False)):
            prefix, _, _, binary = self.make_npm(machine, layout, nested=nested)
            self.assertIsNone(quota._resolve_homebrew(prefix))
            self.assertEqual(quota._resolve_npm(prefix, machine), binary)
            self.assertIsNone(quota._resolve_npm(prefix, "x86_64" if machine == "arm64" else "arm64"))

    def test_npm_rejects_wrong_arch_nonexec_and_fake_universal(self):
        prefix, _, _, binary = self.make_npm("arm64", "bin/codex", nested=True)
        arm = quota._NPM_ARCH["arm64"][2]
        intel = quota._NPM_ARCH["x86_64"][2]
        for payload in (self.macho(intel), self.macho(arm, 6), b"\xcf\xfa\xed\xfe",
                        struct.pack(">7I", 0xCAFEBABE, 1, arm, 0, 28, 32, 0) + self.macho(intel),
                        struct.pack(">7I", 0xCAFEBABE, 1, arm, 0, 28, 64, 0) + self.macho(arm)):
            binary.write_bytes(payload)
            self.assertIsNone(quota._resolve_npm(prefix, "arm64"))
        binary.write_bytes(struct.pack(">7I", 0xCAFEBABE, 1, arm, 0, 28, 32, 0) + self.macho(arm))
        self.assertEqual(quota._resolve_npm(prefix, "arm64"), binary)

    def test_npm_rejects_launcher_chain_and_package_or_executable_symlinks(self):
        prefix, root, native, binary = self.make_npm("arm64", "bin/codex", nested=True)
        wrapper = root / "bin/codex.js"
        entry = prefix / "bin/codex"
        entry.unlink()
        alternate = entry.with_name("hop")
        alternate.symlink_to(wrapper)
        entry.symlink_to(alternate)
        self.assertIsNone(quota._resolve_npm(prefix, "arm64"))
        entry.unlink()
        entry.symlink_to(wrapper)
        outside = self.dir / "outside"
        outside.write_bytes(binary.read_bytes())
        outside.chmod(0o755)
        binary.unlink()
        binary.symlink_to(outside)
        self.assertIsNone(quota._resolve_npm(prefix, "arm64"))
        binary.unlink()
        binary.write_bytes(outside.read_bytes())
        binary.chmod(0o755)
        moved = native.with_name("another-package")
        native.rename(moved)
        native.symlink_to(moved, target_is_directory=True)
        self.assertIsNone(quota._resolve_npm(prefix, "arm64"))

    def test_npm_rejects_wrong_manifest_and_group_writable_paths(self):
        prefix, _, native, binary = self.make_npm("arm64", "bin/codex", nested=True)
        manifest = native / "package.json"
        good = json.loads(manifest.read_text())
        manifest.write_text(json.dumps({**good, "version": "0.5.0-darwin-arm64"}))
        self.assertIsNone(quota._resolve_npm(prefix, "arm64"))
        manifest.write_text(json.dumps(good))
        binary.parent.chmod(0o777)
        self.assertIsNone(quota._resolve_npm(prefix, "arm64"))
        binary.parent.chmod(0o755)
        binary.chmod(0o775)
        self.assertIsNone(quota._resolve_npm(prefix, "arm64"))

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


    def test_force_swr_transient_failure_disk_scope_and_explicit_logout(self):
        import quota_runtime
        entered, release = threading.Event(), threading.Event()
        fake = self.fake("raise AssertionError('transport must be mocked')")

        def wire(*args):
            return quota._status("live", quota=quota.parse_rate_limits({"rateLimits": {
                "limitId": "codex", "secondary": {"usedPercent": 5, "windowDurationMins": 10080}
            }}, time.time()))

        with patch.object(quota, "_find_codex", return_value=fake), patch.object(quota, "_probe", side_effect=wire):
            quota.fetch_codex_cli_quota(True)
            old = self.wait_for(lambda s: s["quota"] is not None)
        old_slot = old["quota"]["secondary"]
        cache = Path(os.environ["TOOTOO_HOME"]) / quota._CACHE_NAME
        self.assertEqual(cache.stat().st_mode & 0o777, 0o600)
        self.assertEqual(set(json.loads(cache.read_text())), {"version", "scope", "fetched_at", "primary", "secondary"})

        def fail(*args):
            entered.set()
            release.wait(1)
            return quota._status("unavailable", "cli_timeout")

        with patch.object(quota, "_find_codex", return_value=fake), patch.object(quota, "_probe", side_effect=fail) as probe:
            generation = quota_runtime.generation()
            current = quota.fetch_codex_cli_quota(True, force=True)
            self.assertEqual(current["quota"]["secondary"], old_slot)
            self.assertTrue(current["status"]["refreshing"])
            self.assertTrue(entered.wait(.8))
            quota.fetch_codex_cli_quota(True, force=True)
            release.set()
            self.assertNotEqual(quota_runtime.wait(generation, timeout=1), generation)
            self.assertEqual(quota.peek_codex_app_quota()["quota"]["secondary"], old_slot)
            self.assertEqual(quota.peek_codex_app_quota()["status"]["reason"], "cli_timeout")
            quota.fetch_codex_cli_quota(True, force=True)  # No immediate extra subprocess after fast completion.
            self.assertEqual(probe.call_count, 1)

        def logged_out(*args):
            entered.set()
            release.wait(1)
            return quota._status("unavailable", "cli_auth")

        quota.stop_codex_cli_quota()
        entered.clear()
        release.clear()
        with patch.object(quota, "_find_codex", return_value=fake), patch.object(quota, "_probe", side_effect=logged_out):
            generation = quota_runtime.generation()
            restored = quota.fetch_codex_cli_quota(True)
            self.assertEqual(restored["quota"]["secondary"], old_slot)
            self.assertTrue(restored["status"]["refreshing"])
            self.assertTrue(entered.wait(.8))
            release.set()
            quota_runtime.wait(generation, timeout=1)
            self.assertIsNone(quota.peek_codex_app_quota()["quota"])
            self.assertEqual(quota.peek_codex_app_quota()["status"]["reason"], "cli_auth")
            self.assertFalse(cache.exists())

    def test_profile_change_hides_current_disk_values_and_data_dir_alias(self):
        import quota_runtime
        fake = self.fake("raise AssertionError()")
        state = Path(os.environ["TOOTOO_HOME"])
        with patch.dict(os.environ, {"TOOTOO_HOME": "", "TOOTOO_DATA_DIR": str(state)}):
            self.assertEqual(quota_runtime.data_root(), str(state))
            key = quota._key_for(fake, quota._context())
        value = quota.parse_rate_limits({"rateLimits": {"primary": {"usedPercent": 5, "windowDurationMins": 10080}}},
                                        time.time())
        quota._save_snapshot(key, value)
        self.assertIsNotNone(quota._load_snapshot(key))
        # Only metadata of the fixed config path binds scope.
        (self.dir / "config.toml").touch()
        next_key = quota._key_for(fake, quota._context())
        self.assertNotEqual(next_key, key)
        self.assertIsNone(quota._load_snapshot(next_key))
        with patch.dict(os.environ, {"TOOTOO_DATA_DIR": str(self.dir / "ignored")}):
            self.assertEqual(quota_runtime.data_root(), str(state))


if __name__ == "__main__":
    unittest.main()
