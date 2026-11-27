import unittest
from datetime import datetime
from unittest.mock import patch
import scanner


class GrokBotFilterTests(unittest.TestCase):
    def test_grok_filter_preserves_message_quota_and_available_tools_without_other_usage(self):
        now = datetime.now().astimezone()
        event = {
            "tool": "codex", "model": "gpt-5", "session": "codex-1",
            "day": now.date().isoformat(), "hour": now.hour, "ts": now.timestamp(),
            "in": 20, "out": 5, "cr": 0, "cw": 0,
        }
        quota = {"buckets": [{"key": "grokbot:weekly", "used_percent": 20}]}
        activity = {"sessions": 2, "user_messages": 3, "bot_replies": 4, "quota": quota}
        unavailable = {"quota": None, "status": {"state": "unavailable"}}
        with patch.multiple(
            scanner, _MEM_OBSERVED_TS=-1.0, _MEM_OBSERVED_RATES={},
        ), patch.object(scanner, "scan_all_events", return_value=([event], {}, 0)), \
                patch.object(scanner, "trigger_background_sync_if_stale"), \
                patch.object(scanner, "_record_evo_telemetry", return_value=0), \
                patch.object(scanner, "select_antigravity_quota", return_value=(unavailable, False)), \
                patch.object(scanner, "select_codex_quota", return_value=(None, unavailable["status"])), \
                patch.object(scanner, "grokbot_activity", return_value=activity):
            all_tools = scanner.build_telemetry("today", "all")
            grok_only = scanner.build_telemetry("today", "grokbot")
        self.assertEqual(grok_only["tool_filter"], "grokbot")
        self.assertEqual(grok_only["grokbot"], activity)
        self.assertEqual(grok_only["quotas"]["grokbot"], quota)
        self.assertEqual(grok_only["available_tools"], all_tools["available_tools"])
        self.assertEqual(grok_only["tools"], [])
        self.assertEqual(grok_only["kpi"]["tokens"], 0)
        self.assertEqual(grok_only["kpi"]["requests"], 0)
        self.assertEqual(all_tools["kpi"]["tokens"], 25)
