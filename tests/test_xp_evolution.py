import concurrent.futures
import json
import tempfile
import time
import unittest
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

import scanner


TODAY = "2026-11-24"
YESTERDAY = "2026-11-23"
TOMORROW = "2026-11-25"


def home(day, amount):
    return {"home": {"xp_boost": {"day": day, "tokens": amount}}}


def event(day, amount):
    return {"day": day, "in": amount, "out": 0, "cr": 0, "cw": 0}


class EvolutionBoostTests(unittest.TestCase):
    def setUp(self):
        self.stack = self.enterContext(ExitStack())
        self.root = Path(self.stack.enter_context(tempfile.TemporaryDirectory()))
        self.day = self.stack.enter_context(patch.object(scanner, "_local_day", return_value=TODAY))
        self.install_profile(self.root)

    def install_profile(self, root):
        return self.stack.enter_context(patch.multiple(
            scanner, CACHE_DIR=str(root), CARROT_STATE_FILE=str(root / "carrot_state.json"),
            EVO_STATE_FILE=str(root / "evo_state.json"), _MEM_EVO_STATE=None, _REAL_DAY_TOTAL=None))

    def peak(self):
        return json.loads(Path(scanner.EVO_STATE_FILE).read_text())

    def test_post_persists_from_same_day_cache_even_without_telemetry_refresh(self):
        real = 48_000_000
        scanner._record_evo_telemetry(TODAY, real, time.monotonic())
        with patch.object(scanner, "scan_all_events", side_effect=AssertionError("unexpected fallback scan")):
            saved = scanner.save_carrot_state(home(TODAY, 3_000_000))
        self.assertEqual(saved["home"]["xp_boost"]["tokens"], 3_000_000)
        self.assertEqual(self.peak()["peak_daily_tokens"], 51_000_000)
        self.day.return_value = TOMORROW
        scanner._MEM_EVO_STATE = None  # fresh process re-reads the durable file
        scanner._REAL_DAY_TOTAL = None
        self.assertEqual(scanner._record_evo_telemetry(TOMORROW, 4, time.monotonic()), 51_000_000)
        self.assertEqual(scanner.load_carrot_state()["home"]["xp_boost"], {"day": "", "tokens": 0})
        self.assertEqual(self.peak()["peak_day"], TODAY)

    def test_fallback_local_only_discards_stale_cache_and_historical_events(self):
        scanner._REAL_DAY_TOTAL = (YESTERDAY, 999_999_999, time.monotonic())
        events = [event(YESTERDAY, 999_999_999), event(TODAY, 48_000_000), event(TODAY, 1_000_000)]
        with patch.object(scanner, "scan_all_events", return_value=(events, {}, 0)) as scan, \
                patch.object(scanner, "trigger_background_sync_if_stale", side_effect=AssertionError("remote call")):
            scanner.save_carrot_state(home(TODAY, 2_000_000))
        scan.assert_called_once_with()
        self.assertEqual(self.peak()["peak_daily_tokens"], 51_000_000)
        self.assertEqual(events[-1]["in"], 1_000_000)

    def test_midnight_during_local_scan_does_not_accept_old_reward(self):
        def scan():
            self.day.return_value = TOMORROW
            return ([event(TODAY, 1_000_000), event(TOMORROW, 800_000)], {}, 0)
        with patch.object(scanner, "scan_all_events", side_effect=scan):
            state = scanner.save_carrot_state(home(TODAY, 1_000_000))
        self.assertEqual(state["home"]["xp_boost"], {"day": "", "tokens": 0})
        self.assertFalse(Path(scanner.EVO_STATE_FILE).exists())
        self.assertEqual(scanner._record_evo_telemetry(TOMORROW, 800_000, time.monotonic()), 800_000)

    def test_invalid_boosts_cannot_change_peak_or_erase_accepted_same_day_value(self):
        scanner._record_evo_telemetry(TODAY, 5, time.monotonic())
        scanner.save_carrot_state(home(TODAY, 42))
        for wrong in (home(YESTERDAY, 1000), home(TOMORROW, 1000), home(TODAY + "x", 1000),
                      home(TODAY, True), home(TODAY, 59.0), home(TODAY, "59"), home(TODAY, -10)):
            with patch.object(scanner, "scan_all_events", side_effect=AssertionError("invalid payload caused scan")):
                state = scanner.save_carrot_state(wrong)
            self.assertEqual(state["home"]["xp_boost"]["tokens"], 42)
        self.assertEqual(self.peak()["peak_daily_tokens"], 47)

    def test_telemetry_reads_existing_boost_without_changing_usage_or_backfilling(self):
        actual = scanner.datetime.now().astimezone().date().isoformat()
        self.day.return_value = actual
        target = Path(scanner.CARROT_STATE_FILE)
        target.write_text(json.dumps(home(actual, 3_000_000)))
        with patch.object(scanner, "scan_all_events", return_value=([], {}, 0)), \
                patch.object(scanner, "trigger_background_sync_if_stale"), \
                patch.object(scanner, "fetch_antigravity_quota", return_value=None), \
                patch.object(scanner, "select_antigravity_quota", return_value=({"quota": None, "status": {}}, False)):
            result = scanner.build_telemetry(range_key="yesterday")
        self.assertEqual(result["today_tokens"], 0)
        self.assertEqual(result["kpi"]["tokens"], 0)
        self.assertEqual(result["evo_peak_tokens"], 3_000_000)
        self.assertEqual(self.peak()["peak_day"], actual)

    def test_concurrent_home_writes_save_a_single_monotonic_peak(self):
        scanner._record_evo_telemetry(TODAY, 1_000_000, time.monotonic())
        with concurrent.futures.ThreadPoolExecutor() as pool:
            list(pool.map(lambda n: scanner.save_carrot_state(home(TODAY, n)), [30, 9, 72, 18, 1, 70]))
        self.assertEqual(scanner.load_carrot_state()["home"]["xp_boost"]["tokens"], 72)
        self.assertEqual(self.peak()["peak_daily_tokens"], 1_000_072)
        self.assertEqual(list(self.root.glob(".evo_state.json.*")), [])

    def test_failed_peak_replace_rolls_back_carrot_and_can_retry(self):
        scanner._record_evo_telemetry(TODAY, 48, time.monotonic())
        scanner.save_carrot_state(home(TODAY, 1))
        replace = scanner.os.replace

        def fail_evo(src, dst):
            if dst == scanner.EVO_STATE_FILE:
                raise OSError("simulated peak replace failure")
            return replace(src, dst)

        with patch.object(scanner.os, "replace", side_effect=fail_evo):
            with self.assertRaisesRegex(OSError, "simulated peak replace failure"):
                scanner.save_carrot_state({**home(TODAY, 3), "balance": 77})
        saved = scanner.load_carrot_state()
        self.assertEqual(saved["home"]["xp_boost"]["tokens"], 1)
        self.assertIsNone(saved["balance"])
        self.assertEqual(scanner._record_evo_telemetry(TODAY, 48, time.monotonic()), 49)
        self.assertEqual(self.peak()["peak_daily_tokens"], 49)
        scanner.save_carrot_state({**home(TODAY, 3), "balance": 77})
        self.assertEqual(self.peak()["peak_daily_tokens"], 51)

    def test_isolated_home_and_real_cache(self):
        scanner._record_evo_telemetry(TODAY, 300, time.monotonic())
        scanner.save_carrot_state(home(TODAY, 700))
        self.install_profile(self.root / "debug")
        self.assertEqual(scanner._record_evo_telemetry(TODAY, 1, time.monotonic()), 1)
        self.assertEqual(scanner.load_carrot_state()["home"]["xp_boost"]["tokens"], 0)
        self.assertEqual(json.loads((self.root / "evo_state.json").read_text())["peak_daily_tokens"], 1000)
