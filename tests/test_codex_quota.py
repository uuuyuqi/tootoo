import contextlib
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.request import urlopen

import scanner
from server import ThreadingHTTPServer, TooTooHandler


def bucket(used, minutes=10080):
    return {"used_percent": used, "window_minutes": minutes}


def token(hour, primary=None, secondary=None, **metadata):
    return {
        "timestamp": f"2026-11-23T{hour:02}:00:00Z",
        "type": "event_msg",
        "payload": {
            "type": "token_count",
            "rate_limits": {"primary": primary, "secondary": secondary, **metadata},
        },
    }


class CodexQuotaTests(unittest.TestCase):
    def setUp(self):
        self.stack = self.enterContext(contextlib.ExitStack())
        self.home = Path(self.stack.enter_context(tempfile.TemporaryDirectory()))
        self.override = self.home / "custom-codex"
        self.stack.enter_context(patch.dict(os.environ, {"CODEX_HOME": str(self.override)}))
        state = self.home / ".tootoo"
        self.stack.enter_context(patch.multiple(
            scanner, HOME=str(self.home), CACHE_DIR=str(state), CACHE_FILE=str(state / "cache.json"),
            CONFIG_FILE=str(state / "config.json"), EVO_STATE_FILE=str(state / "evo.json"),
            CARROT_STATE_FILE=str(state / "carrot.json"),
            _MEM_FILE_CACHE=None, _MEM_SCAN_EVENTS=None, _MEM_SCAN_TS=0.0, _MEM_SCAN_QUOTAS={},
            _MEM_EVO_STATE=None, _MEM_OBSERVED_TS=-1.0, _MEM_OBSERVED_RATES={},
            _CACHE_NEEDS_SAVE=False, _LAST_DISK_SAVE_TS=0.0,
        ))
        self.stack.enter_context(patch.object(scanner, "fetch_antigravity_quota", return_value=None))
        self.stack.enter_context(patch.object(scanner, "trigger_background_sync_if_stale"))

    def log(self, path, *lines):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("".join(json.dumps(line) + "\n" for line in lines), encoding="utf-8")
        return path

    def test_new_empty_and_named_entries_do_not_overwrite_generic(self):
        for generic in ({}, {"limit_id": ""}, {"limit_id": "codex"}):
            with self.subTest(generic=generic):
                path = self.log(
                    self.override / "sessions" / "rollout.jsonl",
                    token(1, primary=bucket(90, 300), limit_id="model"),
                    token(2, secondary=bucket(0), **generic),
                    token(3, primary=bucket(None), limit_id="codex"),
                    token(4, primary=bucket(99), limit_id="model"),
                    token(5),
                )
                quota = scanner.parse_codex_file(str(path))["quota"]
                self.assertEqual(quota["secondary"], bucket(0))

    def test_prefers_newest_usable_snapshot_for_same_priority(self):
        path = self.log(
            self.override / "sessions" / "rollout.jsonl",
            token(1, secondary=bucket(20), limit_id="model"),
            token(4, primary=bucket(30), limit_id="other-model"),
            token(2, secondary=bucket(1), limit_id="model"),
        )
        self.assertEqual(scanner.parse_codex_file(str(path))["quota"]["primary"], bucket(30))

    def test_quota_validation_accepts_zero_and_list_buckets(self):
        self.assertTrue(scanner._has_valid_quota({"primary": bucket(0)}))
        self.assertTrue(scanner._has_valid_quota({"buckets": [None, bucket(0)]}))
        self.assertFalse(scanner._has_valid_quota({"buckets": [None, bucket(None)]}))
        self.assertFalse(scanner._has_valid_quota({"buckets": "invalid"}))

    def test_legacy_empty_caches_heal_once_and_http_serves_weekly_bucket(self):
        old = self.log(self.home / ".codex" / "archived_sessions" / "old.jsonl", token(2, secondary=bucket(0)), token(4))
        empty = self.log(self.override / "sessions" / "empty.jsonl", token(6))
        self.log(self.override / "sessions" / "year" / "model.jsonl", token(5, primary=bucket(40), limit_id="model"))
        # Match current on-disk signatures: these entries would normally be skipped.
        cache_state = {
            "version": 1,
            "files": {
                f"codex:{path}": {
                    "sig": scanner._file_sig(str(path)),
                    "data": {"events": [], "project": None, "quota": invalid},
                }
                for path, invalid in ((old, {"primary": None, "secondary": None}), (empty, {}))
            },
        }
        scanner._save_cache(cache_state)
        with patch.object(scanner, "parse_codex_file", wraps=scanner.parse_codex_file) as parse:
            _, quotas, _ = scanner.scan_all_events(force=True)
            self.assertEqual(parse.call_count, 3)
            self.assertEqual(quotas["codex"]["secondary"], bucket(0))
            self.assertIsNone(scanner._MEM_FILE_CACHE["files"][f"codex:{empty}"]["data"]["quota"])
            scanner.scan_all_events(force=True)
            self.assertEqual(parse.call_count, 3)

        with ThreadingHTTPServer(("127.0.0.1", 0), TooTooHandler) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                with urlopen(f"http://127.0.0.1:{server.server_port}/api/telemetry?range=today&tool=all", timeout=5) as reply:
                    data = json.load(reply)
                self.assertEqual(data["quotas"]["codex"]["secondary"], bucket(0))
            finally:
                server.shutdown()
                thread.join(timeout=5)

    def test_with_only_nulls_omits_codex_quota(self):
        self.log(self.override / "sessions" / "nulls.jsonl", token(1), token(2, secondary=bucket(None)))
        self.assertNotIn("codex", scanner.scan_all_events(force=True)[1])


if __name__ == "__main__":
    unittest.main()
