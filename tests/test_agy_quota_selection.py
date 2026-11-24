import os
import unittest
from unittest.mock import patch

import scanner


class AgyAutoSelectionTests(unittest.TestCase):
    events = [{"tool": "antigravity", "ts": 999_999}, {"tool": "codex", "ts": 1_000_000}]

    def resolve(self, mode, events, reason=None, debug=True):
        quota = {"source": "cli", "buckets": [{"id": "argon_7d", "used_percent": 100}]}
        trial = {"status": {"state": "unavailable", "reason": reason}, "quota": None} if reason else {
            "status": {"state": "live"}, "quota": quota}
        with patch.dict(os.environ, {"TOOTOO_DEBUG": str(int(debug)), "TOOTOO_AGY_CLI": mode}), \
             patch.object(scanner.time, "time", return_value=1_000_000), \
             patch.object(scanner, "fetch_agy_cli_quota", return_value=trial) as cli, \
             patch.object(scanner, "fetch_antigravity_quota", return_value={"quota": {"source": "provider"}}) as legacy:
            result, _ = scanner.select_antigravity_quota(events)
        return result, cli.call_count, legacy.call_count

    def test_auto_recent_only_and_stable_has_no_cli(self):
        for events in ([], [self.events[1]], [{"tool": "antigravity", "ts": 0}]):
            self.assertEqual(self.resolve("auto", events)[1:], (0, 1))
        self.assertEqual(self.resolve("auto", self.events, debug=False)[1:], (0, 1))
        result, cli, legacy = self.resolve("auto", self.events)
        self.assertEqual((cli, legacy), (1, 0))
        self.assertEqual(result["quota"]["buckets"][0]["key"], "antigravity:argon_7d")

    def test_off_invokes_neither_provider_and_cli_failure_never_switches_accounts(self):
        self.assertEqual(self.resolve("off", self.events)[1:], (0, 0))
        result, cli, legacy = self.resolve("auto", self.events, "cli_execution")
        self.assertEqual((cli, legacy), (1, 0))
        self.assertEqual(result["status"]["reason"], "cli_execution")
        self.assertIsNone(result["quota"])

    def test_older_supported_legacy_route_is_exclusive(self):
        result, cli, legacy = self.resolve("auto", self.events, "cli_version")
        self.assertEqual((cli, legacy), (1, 1))
        self.assertEqual(result["quota"], {"source": "provider"})
