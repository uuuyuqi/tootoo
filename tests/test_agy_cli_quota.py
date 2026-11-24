import json
import os
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import agy_cli_quota as cli


def report():
    def group(name, *rows):
        return {"name": name, "buckets": [{"id": key, "window": window,
                "remaining_fraction": value} for key, window, value in rows]}
    return {"status": "SUCCESS", "num_turns": 0, "usage": {"total_tokens": 0},
            "command": {"name": "usage", "data": {"groups": [
                group("Claude and GPT models", ("3p-5h", "5h", 0), ("3p-weekly", "weekly", 1)),
                group("Gemini Models", ("gemini-5h", "5h", 0.89), ("gemini-weekly", "weekly", 0.81)),
                group("Gemini 4 Argon", ("gemini-argon-wtu-weekly", "weekly", 0.53)),
            ]}}}


class AgyCliQuotaTest(unittest.TestCase):
    def setUp(self):
        cli.stop_agy_cli_quota()
        self.addCleanup(cli.stop_agy_cli_quota)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name)
        self.settings = self.home / ".gemini/antigravity-cli/settings.json"
        self.settings.parent.mkdir(parents=True)
        self.mock_home = patch.object(cli.Path, "home", return_value=self.home)
        self.mock_home.start()
        self.addCleanup(self.mock_home.stop)

    def read_until_settled(self, timeout=2):
        deadline = time.monotonic() + timeout
        result = cli.fetch_agy_cli_quota(True)
        while result["status"]["state"] == "loading" and time.monotonic() < deadline:
            time.sleep(.01)
            result = cli.fetch_agy_cli_quota(True)
        self.assertNotEqual(result["status"]["state"], "loading")
        return result

    def test_exact_groups_zero_and_missing_gemini(self):
        raw = report()
        groups = raw["command"]["data"]["groups"]
        data = cli.parse_usage(json.dumps(raw).encode(), time.time())
        buckets = {b["id"]: b for b in data["buckets"]}
        self.assertEqual(set(buckets), {"gemini_5h", "gemini_7d", "cg_5h", "cg_7d", "argon_7d"})
        self.assertEqual(buckets["cg_5h"]["used_percent"], 100)
        self.assertEqual(buckets["cg_7d"]["used_percent"], 0)
        self.assertEqual(buckets["argon_7d"]["group_id"], "argon")
        self.assertEqual(buckets["gemini_5h"]["used_percent"], 11)
        groups.pop(1)
        self.assertFalse(any(x["group_id"] == "gemini" for x in cli.parse_usage(json.dumps(raw).encode(), 0)["buckets"]))

    def test_full_epoch_zero_windows_survive_with_no_reset_and_cache(self):
        raw = report()
        third_party, gemini, _ = raw["command"]["data"]["groups"]
        for item in third_party["buckets"]:
            item.update(remaining_fraction=1, reset_time="1970-01-01T00:00:00Z")
        now = time.time()
        gemini["buckets"][0]["reset_time"] = "2020-01-01T00:00:00Z"
        encoded = json.dumps(raw).encode()
        buckets = {b["id"]: b for b in cli.parse_usage(encoded, now)["buckets"]}
        self.assertEqual(set(buckets), {"cg_5h", "cg_7d", "gemini_7d", "argon_7d"})
        for key in ("cg_5h", "cg_7d"):
            self.assertEqual(buckets[key]["used_percent"], 0)
            self.assertIsNone(buckets[key]["resets_at"])
        self.assertEqual(buckets["argon_7d"]["remaining_fraction"], .53)
        with patch.object(cli, "_find_agy", return_value=Path(sys.executable)), patch.object(
            cli, "_exec", side_effect=((b"agy 1.5.15\n", None), (encoded, None))
        ) as launch:
            result = self.read_until_settled()
            self.assertEqual(result["quota"]["source"], "cli_cached")
            self.assertEqual({b["id"] for b in result["quota"]["buckets"]}, set(buckets))
            self.assertEqual([b["resets_at"] for b in result["quota"]["buckets"]
                              if b["id"].startswith("cg_")], [None, None])
            self.assertEqual(launch.call_count, 2)

    def test_epoch_zero_requires_exact_full_valid_aware_timestamp(self):
        raw = report()
        third_party = raw["command"]["data"]["groups"][0]["buckets"]
        third_party[1].update(reset_time="1970-01-01T00:00:00+00:00")
        for value, reset in (
            (0, "1970-01-01T00:00:00Z"),
            (.99, "1970-01-01T00:00:00Z"),
            (1, 0),
            (1, "1970-01-01T00:00:00"),
            (1, "1970-01-01T00:00:01Z"),
            (1, "not-a-date"),
        ):
            third_party[0].update(remaining_fraction=value, reset_time=reset)
            buckets = {b["id"]: b for b in cli.parse_usage(json.dumps(raw).encode(), time.time())["buckets"]}
            self.assertNotIn("cg_5h", buckets, (value, reset))
            self.assertIsNone(buckets["cg_7d"]["resets_at"])

    def test_one_turn_wrong_command_and_duplicate_ids_fail_closed(self):
        raw = report()
        for change in ({"num_turns": 1}, {"num_turns": False}, {"usage": {"input_tokens": 1}},
                       {"status": "ERROR"}, {"command": {"name": "model"}}, {"error": "failure"}):
            self.assertIsNone(cli.parse_usage(json.dumps({**raw, **change}).encode(), 0), change)
        groups = raw["command"]["data"]["groups"]
        groups.append(groups[0])
        self.assertIsNone(cli.parse_usage(json.dumps(raw).encode(), 0))

    def test_settings_preflight_blocks_both_unknown_and_disabled(self):
        with patch.object(cli, "_exec") as launch:
            for payload in ('{"disableSlashCommands":true}', '{"disableSlashCommands":"false"}',
                            '{"disableSlashCommands":true,"disableSlashCommands":false}', '{"broken"'):
                self.settings.write_text(payload)
                status = cli.fetch_agy_cli_quota(True)["status"]
                self.assertEqual(status["reason"], "cli_settings")
            self.assertEqual(cli.fetch_agy_cli_quota(False)["status"]["state"], "disabled")
            launch.assert_not_called()

    def test_check_effective_settings_again_before_usage(self):
        def changed(*args):
            self.settings.write_text('{"disableSlashCommands":true}')
            return b"v1.5.15\n", None
        with patch.object(cli, "_find_agy", return_value=Path(sys.executable)), patch.object(cli, "_exec", side_effect=changed) as launch:
            self.assertEqual(self.read_until_settled()["status"]["reason"], "cli_settings")
            self.assertEqual(launch.call_count, 1)
            self.assertEqual(launch.call_args.args[1], ["--version"])

    def test_no_shell_or_old_build_and_cache_is_labeled(self):
        loc = self.home / ".local/bin/agy"
        loc.parent.mkdir(parents=True)
        loc.write_text("#!/bin/sh\necho v1.5.15\n")
        loc.chmod(0o755)
        self.assertIsNone(cli._find_agy(self.home))
        with patch.object(cli, "_find_agy", return_value=Path(sys.executable)), patch.object(cli, "_exec", return_value=(b"1.1.10", None)) as old:
            self.assertEqual(self.read_until_settled()["status"]["reason"], "cli_version")
            self.assertEqual(old.call_count, 1)
        cli.fetch_agy_cli_quota(False)
        def fake(exe, args, cwd, env, *_):
            self.assertTrue(Path(cwd).is_dir())
            self.assertFalse(list(Path(cwd).iterdir()))
            self.assertEqual(set(env), {"HOME", "USER", "LOGNAME", "PATH", "LANG", "NO_COLOR"})
            if args == ["--version"]:
                return b"agy 1.5.15\n", None
            self.assertEqual(args, ["-p", "/usage", "--output-format", "json"])
            return json.dumps(report()).encode(), None
        with patch.object(cli, "_find_agy", return_value=Path(sys.executable)), patch.object(cli, "_exec", side_effect=fake) as launch:
            self.assertEqual(self.read_until_settled()["status"]["state"], "cached")
            self.assertEqual(cli.fetch_agy_cli_quota(True)["quota"]["source"], "cli_cached")
            self.assertEqual(launch.call_count, 2)

    def test_transport_timeout_cap_and_exit(self):
        for code, reason in (("import time; time.sleep(30)", "cli_timeout"),
                             ("print('x'*1000000)", "cli_output_limit"),
                             ("print('looks valid'); raise SystemExit(1)", "cli_exit")):
            start = time.monotonic()
            self.assertEqual(cli._exec(sys.executable, ["-c", code], self.home, os.environ, .5, 2048),
                             (None, reason))
            self.assertLess(time.monotonic() - start, 1.25)
        self.assertEqual(cli._exec(sys.executable, ["-c", "print('ok')"], self.home, os.environ, 2, 2048),
                         (b"ok\n", None))

    def test_background_singleflight_accepts_response_after_old_deadline(self):
        launched = threading.Event()
        original = cli._exec

        def slow(exe, args, cwd, env, timeout, cap, cancelled):
            if args == ["--version"]:
                return b"1.5.15", None
            launched.set()
            self.assertEqual(timeout, 20)
            self.assertEqual(cap, 512 * 1024)
            body = json.dumps(report())
            code = f"import time; time.sleep(7); print({body!r})"
            return original(sys.executable, ["-c", code], cwd, env, timeout, cap, cancelled)

        with patch.object(cli, "_find_agy", return_value=Path(sys.executable)), patch.object(cli, "_exec", side_effect=slow) as launch:
            self.assertEqual(cli.fetch_agy_cli_quota(True)["status"]["state"], "loading")
            self.assertTrue(launched.wait(1))
            start = time.monotonic()
            for _ in range(10):
                self.assertEqual(cli.fetch_agy_cli_quota(True)["status"]["state"], "loading")
            self.assertLess(time.monotonic() - start, 1)
            self.assertEqual(self.read_until_settled(timeout=12)["quota"]["source"], "cli_cached")
            self.assertEqual(launch.call_count, 2)

    def test_stop_cancels_child_and_drops_pending_value(self):
        working = threading.Event()
        actual = cli._exec

        def wait(exe, args, cwd, env, timeout, cap, cancelled):
            if args == ["--version"]:
                return b"1.5.15", None
            working.set()
            return actual(sys.executable, ["-c", "import time; time.sleep(30)"], cwd, env, timeout, cap, cancelled)

        with patch.object(cli, "_find_agy", return_value=Path(sys.executable)), patch.object(cli, "_exec", side_effect=wait):
            self.assertEqual(cli.fetch_agy_cli_quota(True)["status"]["state"], "loading")
            self.assertTrue(working.wait(1))
            start = time.monotonic()
            cli.stop_agy_cli_quota()
            self.assertLess(time.monotonic() - start, 1)
            self.assertIsNone(cli._pending)
            self.assertIsNone(cli._cache_result)
