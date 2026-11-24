import concurrent.futures
import os
import sys
import tempfile
import textwrap
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from codex_app_quota import OPT_IN, CodexQuotaReader, _probe, parse_rate_limits


class AppServerQuotaTests(unittest.TestCase):
    def fake(self, directory, body):
        fake = Path(directory, "codex")
        fake.write_text(f"#!{sys.executable}\n"
                        "import json, os, pathlib, sys, time\n"
                        "def read(): return json.loads(sys.stdin.readline())\n"
                        "def write(value): print(json.dumps(value), flush=True)\n"
                        + textwrap.dedent(body))
        fake.chmod(0o755)
        return str(fake)

    def test_wire_and_concurrent_refresh_use_one_cli_child(self):
        with tempfile.TemporaryDirectory() as temp:
            self.fake(temp, '''
                assert sys.argv[1:] == ["app-server", "--listen", "stdio://"]
                assert "OPENAI_API_KEY" not in os.environ
                assert "CODEX_HOME" in os.environ
                with pathlib.Path(__file__).with_name("launches").open("a") as f:
                    f.write("x")
                req = read()
                assert req["method"] == "initialize" and req["id"] == 1
                write({"id": 1, "result": {"userAgent": "fixture"}})
                assert read() == {"method": "initialized"}
                assert read() == {"id": 2, "method": "account/rateLimits/read"}
                # Unsolicited server request must never be treated as a response.
                write({"id": 2, "method": "account/chatgptAuthTokens/refresh", "params": {}})
                now = int(time.time())
                write({"id": 2, "result":{"rateLimitsByLimitId":{"codex":{
                    "limitId":"codex",
                    "primary":{"usedPercent":0,"windowDurationMins":10080,"resetsAt":now+1000},
                    "secondary":{"usedPercent":5,"windowDurationMins":10080,"resetsAt":now+2000},
                    "credits":{"ignored":"do not return"} }}}})
            ''')
            with patch.dict(os.environ, {OPT_IN: "1", "PATH": temp, "CODEX_HOME": temp,
                                         "OPENAI_API_KEY": "synthetic-must-not-inherit"}):
                reader = CodexQuotaReader()
                with concurrent.futures.ThreadPoolExecutor(5) as pool:
                    results = list(pool.map(lambda _: reader.fetch(), range(5)))
                self.assertEqual(Path(temp, "launches").read_text(), "x")
                for status, quota in results:
                    self.assertEqual(status, "live")
                    self.assertEqual(quota["primary"]["used_percent"], 0)
                    self.assertEqual(quota["secondary"]["used_percent"], 5)
                    self.assertEqual(quota["primary"]["window_minutes"], 10080)
                    self.assertEqual(quota["secondary"]["window_minutes"], 10080)
                    self.assertNotEqual(quota["primary"]["resets_at"], quota["secondary"]["resets_at"])
                    self.assertNotIn("credits", quota)
                # Mutating one consumer's payload must not mutate cache or peers.
                results[0][1]["primary"]["used_percent"] = 45
                self.assertEqual(reader.fetch()[1]["primary"]["used_percent"], 0)
                with patch.dict(os.environ, {OPT_IN: "0"}):
                    self.assertEqual(reader.fetch(), ("disabled", None))
                self.assertEqual(reader.fetch()[0], "live")
                self.assertEqual(Path(temp, "launches").read_text(), "xx")

    def test_hung_and_continuously_noisy_server_are_bounded(self):
        with tempfile.TemporaryDirectory() as temp:
            for body in ["time.sleep(30)", "print('x' * 5000000, flush=True)"]:
                fake = self.fake(temp, body)
                start = time.monotonic()
                self.assertEqual(_probe(fake, timeout=0.15), ("unavailable", None))
                self.assertLess(time.monotonic() - start, 1.25)

    def test_refusal_does_not_attempt_login(self):
        with tempfile.TemporaryDirectory() as temp:
            fake = self.fake(temp, '''
                assert read()["method"] == "initialize"
                write({"id": 1, "result": {}})
                assert read()["method"] == "initialized"
                assert read()["method"] == "account/rateLimits/read"
                write({"id": 2, "error": {"message": "login required"}})
            ''')
            self.assertEqual(_probe(fake), ("unavailable", None))

    def test_parse_keeps_independent_secondary_rejects_expired_and_does_not_merge(self):
        weekly = {"usedPercent": 5, "windowDurationMins": 10080, "resetsAt": 400}
        generic = {"limitId": "codex", "primary": {"usedPercent": 19, "windowDurationMins": 300,
                                                    "resetsAt": 100}, "secondary": weekly}
        other = {"limitId": "codex_other", "primary": weekly}
        self.assertIsNone(parse_rate_limits({"rateLimits": other}, 100))
        payload = {"rateLimits": other, "rateLimitsByLimitId": {"codex": generic, "codex_other": other}}
        parsed = parse_rate_limits(payload, 100)
        self.assertIsNone(parsed["primary"])
        self.assertEqual(parsed["secondary"], {"used_percent": 5, "window_minutes": 10080, "resets_at": 400})
        self.assertIsNone(parse_rate_limits(payload, 401))
        weekly["usedPercent"] = True
        self.assertIsNone(parse_rate_limits(payload, 100))
        weekly["usedPercent"] = float("nan")
        self.assertIsNone(parse_rate_limits(payload, 100))


if __name__ == "__main__":
    unittest.main()
