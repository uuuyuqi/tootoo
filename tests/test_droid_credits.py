from contextlib import contextmanager
from datetime import datetime, timedelta
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import scanner
import server


class FixedClock(datetime):
    current = datetime(2026, 11, 18, 12).astimezone()  # Wednesday; not near a DST boundary.

    @classmethod
    def now(cls, tz=None):
        return cls.current.astimezone(tz) if tz else cls.current.replace(tzinfo=None)


class DroidCreditsTests(unittest.TestCase):
    def setUp(self):
        root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.home = root / "home"
        self.state = root / "state"
        self.state.mkdir()
        self.config = self.state / "config.json"
        self.cache = self.state / "scan_cache_v6.json"
        self.sessions = self.home / ".factory" / "sessions" / "sample-project"
        self.sessions.mkdir(parents=True)
        self.enterContext(patch.dict(os.environ, {
            "HOME": str(self.home), "TOOTOO_HOME": str(self.state),
            "CODEX_HOME": str(self.home / ".codex"),
            "TOOTOO_CODEX_QUOTA_AUTO": "off", "TOOTOO_AGY_CLI": "off",
        }))
        self.enterContext(patch.multiple(
            scanner, HOME=str(self.home), CACHE_DIR=str(self.state), CACHE_FILE=str(self.cache),
            CONFIG_FILE=str(self.config), CARROT_STATE_FILE=str(self.state / "carrot_state.json"),
            EVO_STATE_FILE=str(self.state / "evo_state.json"), _ARCHIVE_OWNER=None,
            _MEM_SCAN_ARCHIVES=None, _MEM_SCAN_EVENTS=None, _MEM_SCAN_QUOTAS={}, _MEM_FILE_CACHE=None,
            _MEM_SCAN_TS=0.0, _LAST_DISK_SAVE_TS=0.0, _CACHE_NEEDS_SAVE=False,
            _MEM_OBSERVED_TS=-1.0, _MEM_OBSERVED_RATES={}, _MEM_EVO_STATE=None,
            _REAL_DAY_TOTAL=None, datetime=FixedClock,
        ))
        self.enterContext(patch.object(scanner, "trigger_background_sync_if_stale"))
        self.addCleanup(lambda: scanner._ARCHIVE_OWNER and scanner._ARCHIVE_OWNER.close())

    def session(self, name, usage, hours=1):
        path = self.sessions / (name + ".settings.json")
        path.write_text(json.dumps({"model": "gpt-5", "tokenUsage": usage}), encoding="utf-8")
        ts = FixedClock.current.timestamp() - hours * 3600
        os.utime(path, (ts, ts))
        return path

    @staticmethod
    def droid(data):
        return next((t for t in data["tools"] if t["tool"] == "droid"), None)

    def test_parse_credits_without_coercion_and_keep_credits_only(self):
        for i, (value, expected) in enumerate([
            (0, 0), (19, 19), (0.125, 0.125), (True, 0), (False, 0), (-1, 0),
            ("19", 0), (None, 0), ({}, 0), ([], 0), (float("nan"), 0), (float("inf"), 0),
        ]):
            with self.subTest(value=value):
                path = self.session(str(i), {"inputTokens": 4, "factoryCredits": value})
                self.assertEqual(scanner.parse_droid_settings(path)["events"][0]["credits"], expected)
        self.assertEqual(scanner.parse_droid_settings(self.session("old", {"inputTokens": 4}))["events"][0]["credits"], 0)
        credits_only = self.session("only", {"factoryCredits": 27})
        self.assertEqual(scanner.parse_droid_settings(credits_only)["events"][0]["credits"], 27)
        self.assertEqual(scanner.parse_droid_settings(self.session("zero", {"factoryCredits": 0}))["events"], [])

    def test_cache_migration_reparses_only_old_droid_entries_once_including_empty(self):
        active = self.session("active", {"inputTokens": 3, "factoryCredits": 11})
        empty = self.session("credits-only", {"factoryCredits": 21})
        inactive = self.session("inactive", {})
        current = self.session("already-current", {"inputTokens": 5, "factoryCredits": 9})
        old_data = scanner.parse_droid_settings(active)
        old_data.pop("droid_parser_rev")
        old_data["events"][0].pop("credits")
        def cache_row(path, data):
            return {"sig": scanner._file_sig(str(path)), "data": data}
        self.cache.write_text(json.dumps({"version": 1, "files": {
            f"droid:{active}": cache_row(active, old_data),
            f"droid:{empty}": cache_row(empty, {"events": [], "project": None}),
            f"droid:{inactive}": cache_row(inactive, {"events": [], "project": None}),
            f"droid:{current}": cache_row(current, scanner.parse_droid_settings(current)),
        }}))
        with patch.object(scanner, "parse_droid_settings", wraps=scanner.parse_droid_settings) as parse:
            self.assertEqual(self.droid(scanner.build_telemetry("today", force=True))["credits"], 41)
            scanner.scan_all_events(force=True)
            self.assertEqual({Path(args[0]) for args, _ in parse.call_args_list}, {active, empty, inactive})
        scanner._flush_cache_if_needed(force_disk=True)
        saved = json.loads(self.cache.read_text())["files"]
        self.assertEqual(saved[f"droid:{inactive}"]["data"]["droid_parser_rev"], 2)

    def test_selected_range_totals_and_no_global_accounting_change(self):
        self.session("today", {"inputTokens": 123, "factoryCredits": 100.5})
        base = scanner.build_telemetry("today", force=True)
        self.session("today-credits-only", {"factoryCredits": 0.25})
        self.session("yesterday", {"inputTokens": 2, "factoryCredits": 20}, hours=24)
        self.session("last-week", {"factoryCredits": 40}, hours=5 * 24)
        self.session("last-month", {"factoryCredits": 8}, hours=22 * 24)
        self.session("old", {"factoryCredits": 16}, hours=40 * 24)
        expected = {"today": 100.75, "yesterday": 20, "week": 120.75, "last_week": 40,
                    "month": 160.75, "7d": 160.75, "30d": 168.75, "all": 184.75}
        for key, credits in expected.items():
            with self.subTest(key=key):
                data = scanner.build_telemetry(key, force=True)
                droid = self.droid(data)
                self.assertEqual(droid["credits"], credits)
                self.assertIsNone(droid["quota"])
                self.assertNotIn("droid", data["quotas"])
        today = scanner.build_telemetry("today")
        for key in ("kpi", "today_tokens", "effective_today_tokens", "evo_peak_tokens", "models", "recent_calls", "daily"):
            self.assertEqual(today[key], base[key], key)
        self.assertIsNone(self.droid(scanner.build_telemetry("today", "codex")))

    @contextmanager
    def api(self):
        with server.TooTooServer(("127.0.0.1", 0), server.TooTooHandler) as http:
            t = threading.Thread(target=http.serve_forever, daemon=True)
            t.start()
            try:
                yield f"http://127.0.0.1:{http.server_port}"
            finally:
                http.shutdown()
                t.join(timeout=2)

    def test_real_http_budget_set_validation_and_reset(self):
        window = 5
        self.session("new", {"inputTokens": 10, "factoryCredits": 28.5}, hours=1)
        self.session("older", {"factoryCredits": 5}, hours=4)
        self.session("exact-boundary", {"factoryCredits": 40}, hours=5)
        self.session("future", {"factoryCredits": 100}, hours=-1)
        self.session("no-credits", {"inputTokens": 8}, hours=4.5)
        with self.api() as base:
            def post(**p):
                req = Request(base + "/api/quota/config", json.dumps(p).encode(),
                              {"Content-Type": "application/json"}, method="POST")
                with urlopen(req, timeout=5) as res:
                    return json.load(res)
            def read(range_key="today"):
                with urlopen(base + f"/api/telemetry?range={range_key}", timeout=5) as res:
                    return self.droid(json.load(res))
            self.assertIsNone(read()["quota"])
            self.config.write_text(json.dumps({"other": "keep"}))
            self.assertTrue(post(tool="droid", unit="credits", window_hours=window, limit=50)["ok"])
            q = read("last_week")["quota"]  # No selected-range activity, but the rolling budget is independent.
            self.assertEqual(read("last_week")["credits"], 0)
            self.assertEqual(q, {
                "source": "local_custom", "is_custom": True, "unit": "credits",
                "window_hours": 5, "window_minutes": 300,
                "used_value": 33.5, "limit_value": 50, "used_percent": 67,
                "resets_at": FixedClock.current.timestamp() + 3600,
            })
            for changes in ({"window_hours": 1}, {"limit": 0}, {"limit": True}, {"limit": "20"}, {"tool": "codex"}):
                with self.subTest(changes=changes):
                    with self.assertRaises(HTTPError) as error:
                        post(**({"tool": "droid", "unit": "credits", "window_hours": 5, "limit": 50} | changes))
                    self.assertEqual(error.exception.code, 400)
                    error.exception.close()
            self.assertEqual(read()["quota"], q)
            for hours in (24, 168, 720):
                self.assertTrue(post(tool="droid", unit="credits", window_hours=hours, limit=20_000_000)["ok"])
                self.assertEqual(read()["quota"]["window_hours"], hours)
            self.assertTrue(post(tool="droid", reset=True)["ok"])
            self.assertIsNone(read()["quota"])
            self.assertIsNone(read("last_week"))
            self.assertEqual(json.loads(self.config.read_text()), {"other": "keep", "local_quotas": {}})


if __name__ == "__main__":
    unittest.main()
