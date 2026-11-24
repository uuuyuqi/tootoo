import os
import threading
import unittest
from unittest.mock import patch

import scanner


class NativeCodexQuotaSelectionTests(unittest.TestCase):
    now = 1_000_000
    current_log = {"primary": {"window_minutes": 10080, "used_percent": 9,
                               "resets_at": now+3600}, "secondary": None}
    recent = {"quota": {"source": "app_server", "account_scope": "current_cli",
                        "primary": None, "secondary": {"used_percent": 5, "window_minutes": 10080}},
              "status": {"state": "cached"}}

    def select(self, report, mode="auto", recent=True):
        with patch.dict(os.environ, {"TOOTOO_CODEX_QUOTA_AUTO": mode}), \
             patch.object(scanner, "_MEM_CODEX_ACTIVITY", self.now - 100 if recent else 0), \
             patch.object(scanner.time, "time", return_value=self.now), \
             patch.object(scanner, "peek_codex_app_quota", return_value=self.recent) as peek, \
             patch.object(scanner, "fetch_codex_cli_quota", side_effect=AssertionError("HTTP started a probe")):
            result = scanner.select_codex_quota(report)
            return (*result, peek.call_count)

    def test_browser_selector_only_reads_samples_and_respects_working_log(self):
        quota, status, peek = self.select(self.current_log)
        self.assertEqual((quota["source"], status["state"], peek), ("session_log", "log", 0))
        self.assertEqual(quota["primary"]["used_percent"], 9)
        absent, status, count = self.select(None, mode="")
        self.assertEqual((absent, status["state"], count), (None, "disabled", 0))

    def test_expired_log_never_fills_official_missing_slot(self):
        old = {**self.current_log, "primary": {**self.current_log["primary"], "resets_at": self.now-1}}
        q, status, count = self.select(old)
        self.assertEqual((q, status, count), (self.recent["quota"], self.recent["status"], 1))
        self.assertIsNone(q["primary"])
        self.assertEqual(q["secondary"]["used_percent"], 5)

    def test_only_private_scheduler_launches_for_recent_and_no_usable_log(self):
        closing, gate = threading.Event(), threading.Lock()
        for active, log, stopped, expected in (
                (True, None, False, True), (False, None, False, False),
                (True, self.current_log, False, False), (True, None, True, None)):
            if stopped:
                closing.set()
            with patch.object(scanner, "scan_all_events", return_value=([], {"codex": log}, 0)), \
                 patch.object(scanner, "_MEM_CODEX_ACTIVITY", self.now - 100 if active else 0), \
                 patch.object(scanner.time, "time", return_value=self.now), \
                 patch.object(scanner, "fetch_codex_cli_quota") as fetch:
                scanner.refresh_native_codex_quota(closing, gate)
                if expected is None:
                    fetch.assert_not_called()
                else:
                    fetch.assert_called_once_with(enabled=expected)
