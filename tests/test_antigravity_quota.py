"""Synthetic AGY diagnostics: never discover or connect to a real provider."""
import contextlib
import json
from pathlib import Path
import ssl
import tempfile
import unittest
from unittest.mock import MagicMock, patch

import scanner


GEM_5H = "antigravity:gemini_5h"
GEM_WEEK = "antigravity:gemini_7d"
NOW = 1_800_000_000


def row(key, used=25, reset=NOW + 60, **other):
    return {"key": key, "used_percent": used, "resets_at": reset, **other}


def provider_summary(*windows):
    return {"response": {"groups": [{"displayName": "Gemini", "buckets": [
        {"window": window, "remainingFraction": left, "resetTime": reset}
        for window, left, reset in windows
    ]}]}}


class AntigravityQuotaTests(unittest.TestCase):
    def setUp(self):
        stack = self.enterContext(contextlib.ExitStack())
        cache_dir = Path(stack.enter_context(tempfile.TemporaryDirectory()))
        self.cache_file = cache_dir / "ag-quota.json"
        stack.enter_context(patch.multiple(
            scanner, _AG_QUOTA_CACHE={}, _AG_LAST_QUOTA=None,
            CACHE_DIR=str(cache_dir), AG_QUOTA_CACHE_FILE=str(self.cache_file),
        ))
        self.clock = stack.enter_context(patch.object(scanner.time, "time", return_value=NOW))
        self.monotonic = stack.enter_context(patch.object(scanner.time, "monotonic", return_value=200))
        self.discovery = stack.enter_context(patch.object(scanner, "_antigravity_running_processes", return_value=[]))
        self.endpoints = stack.enter_context(patch.object(scanner, "_antigravity_endpoints", return_value=[]))
        # Fail loudly on any unexpected provider call; no processes or credentials are read.
        self.request = stack.enter_context(patch.object(scanner, "_antigravity_request", side_effect=AssertionError))
        # Keep a reference to the actual transport implementation for mock HTTP connection tests.
        self.real_request = REAL_REQUEST

    def provider(self, *windows):
        self.discovery.return_value = [{"pid": 1}]
        self.endpoints.return_value = [("http", 1, "", False)]
        self.request.side_effect = None
        self.request.return_value = provider_summary(*windows)

    def cache(self, *buckets, fetched_at=NOW-30):
        self.cache_file.write_text(json.dumps({"fetched_at": fetched_at, "buckets": buckets}))

    def test_discovery_and_endpointless_are_unavailable(self):
        expected = {"quota": {}, "status": {"state": "unavailable", "reason": "discovery", "cache_state": "none"}}
        self.assertEqual(scanner.fetch_antigravity_quota(), expected)
        self.discovery.return_value = [{"pid": 1}]
        self.assertEqual(scanner.fetch_antigravity_quota(), expected)
        self.request.assert_not_called()

    def test_expiring_memory_observation_probes_again_and_never_guesses_reset(self):
        self.provider(("5h", .25, NOW+2), ("weekly", 1.0, NOW+3600))
        first = scanner.fetch_antigravity_quota()
        self.assertEqual(first["status"]["state"], "live")
        self.assertEqual(first["quota"]["fetched_at"], NOW)
        self.assertEqual(first["quota"]["buckets"][1]["used_percent"], 0)
        second = scanner.fetch_antigravity_quota()
        self.assertEqual(second["status"], {"state": "cached", "reason": None, "cache_state": "fresh"})
        self.assertEqual(self.request.call_count, 1)

        self.clock.return_value = NOW+2  # equality means reset already arrived
        self.request.side_effect = ssl.SSLError("private TLS detail must never leave backend")
        fallback = scanner.fetch_antigravity_quota()
        self.assertEqual(fallback["status"], {"state": "cached", "reason": "connect_tls", "cache_state": "partial"})
        self.assertEqual(fallback["quota"]["buckets"], [
            {"key": GEM_WEEK, "label": "Gemini 周", "window_minutes": 10080, "used_percent": 0, "resets_at": NOW+3600},
        ])
        self.assertNotIn("private TLS detail", json.dumps(fallback))
        self.assertEqual(self.request.call_count, 2)
        self.assertEqual(scanner.fetch_antigravity_quota(), fallback)  # negative cache keeps sanitized reason
        self.assertEqual(self.request.call_count, 2)
        scanner.fetch_antigravity_quota(force=True)
        self.assertEqual(self.request.call_count, 3)

    def test_disk_cache_drops_expired_undated_and_out_of_range_values(self):
        self.cache(row(GEM_5H, reset=NOW-1), row(GEM_WEEK, used=61, private="never include"))
        result = scanner.fetch_antigravity_quota()
        self.assertEqual(result["status"], {"state": "cached", "reason": "discovery", "cache_state": "partial"})
        self.assertEqual(result["quota"]["buckets"], [
            {"key": GEM_WEEK, "label": "Gemini 周", "window_minutes": 10080, "used_percent": 61, "resets_at": NOW+60},
        ])
        self.clock.return_value = NOW+60
        result = scanner.fetch_antigravity_quota()
        self.assertEqual(result["status"]["cache_state"], "expired")
        self.assertEqual(result["quota"], {})

        scanner._AG_LAST_QUOTA = None
        self.clock.return_value = NOW
        self.cache(row(GEM_5H, reset=None), row(GEM_WEEK, used=101))
        result = scanner.fetch_antigravity_quota()
        self.assertEqual(result["status"]["cache_state"], "invalid")
        self.assertEqual(result["quota"], {})

    def test_invalid_cache_clock_or_json_does_not_fail_telemetry(self):
        for val, expect in [("secret", "invalid"), (NOW+1, "invalid"), (NOW-8*86400, "expired"), (10**500, "invalid")]:
            scanner._AG_LAST_QUOTA = None
            self.cache(row(GEM_WEEK), fetched_at=val)
            result = scanner.fetch_antigravity_quota()
            self.assertEqual(result["status"]["cache_state"], expect)
            self.assertEqual(result["quota"], {})
        scanner._AG_LAST_QUOTA = None
        self.cache_file.write_text("{broken")
        self.assertEqual(scanner.fetch_antigravity_quota()["status"]["cache_state"], "invalid")

    def test_http_status_and_response_shape_distinct_without_raw_output(self):
        self.provider()
        # The production transport runs against a fake HTTP connection only.
        self.request.side_effect = self.real_request
        with patch.object(scanner.http.client, "HTTPConnection") as http:
            connection, response = MagicMock(), MagicMock()
            http.return_value = connection
            connection.getresponse.return_value = response
            response.read.return_value = b"private response"
            response.status = 401
            status = scanner.fetch_antigravity_quota(force=True)
            self.assertEqual(status["status"]["reason"], "http_status")
            self.assertEqual(status["status"]["http_status"], 401)
            self.assertEqual(scanner.fetch_antigravity_quota(), status)
            self.assertEqual(self.request.call_count, 1)
            response.read.assert_not_called()
            response.status = 200
            bad_json = scanner.fetch_antigravity_quota(force=True)
            self.assertEqual(bad_json["status"]["reason"], "response_shape")
            self.assertNotIn("http_status", bad_json["status"])
            self.assertNotIn("private response", json.dumps(bad_json))
            response.read.return_value = b'{"body":"not a quota payload"}'
            wrong_schema = scanner.fetch_antigravity_quota(force=True)
            self.assertEqual(wrong_schema["status"]["reason"], "response_shape")
            self.assertEqual(wrong_schema["quota"], {})
            connection.close.assert_called()

    def test_status_code_is_from_first_http_failure_at_selected_precedence(self):
        self.provider()
        self.endpoints.return_value = [("http", n, "", False) for n in range(1, 4)]
        self.request.side_effect = [OSError("private detail"), scanner._AntigravityProbeFailure("http_status", 404),
                                    scanner._AntigravityProbeFailure("http_status", 503)]
        result = scanner.fetch_antigravity_quota()
        self.assertEqual(result["status"]["http_status"], 404)

        self.request.side_effect = [scanner._AntigravityProbeFailure("http_status", 403), {},
                                    scanner._AntigravityProbeFailure("http_status", 502)]
        result = scanner.fetch_antigravity_quota(force=True)
        self.assertEqual(result["status"]["reason"], "response_shape")
        self.assertNotIn("http_status", result["status"])

        self.endpoints.return_value = [("http", 2, "", False)]
        self.request.side_effect = scanner._AntigravityProbeFailure("http_status", 999)
        result = scanner.fetch_antigravity_quota(force=True)
        self.assertEqual(result["status"]["reason"], "http_status")
        self.assertNotIn("http_status", result["status"])

    def test_live_missing_reset_never_becomes_new_snapshot_offline(self):
        self.provider(("weekly", .2, None))
        self.assertEqual(scanner.fetch_antigravity_quota()["quota"]["buckets"][0]["used_percent"], 80)
        self.assertEqual(scanner.fetch_antigravity_quota()["status"]["state"], "cached")
        self.discovery.return_value = []
        self.assertEqual(scanner.fetch_antigravity_quota()["status"]["state"], "unavailable")

    def test_invalid_provider_fraction_does_not_look_full(self):
        self.provider(("5h", 1.1, NOW+60), ("weekly", -.5, NOW+120))
        result = scanner.fetch_antigravity_quota()
        self.assertEqual(result["status"]["reason"], "response_shape")
        self.assertEqual(result["quota"], {})

    def test_telemetry_separates_status_from_real_buckets(self):
        with patch.multiple(
            scanner, scan_all_events=MagicMock(return_value=([], {}, 0)), trigger_background_sync_if_stale=MagicMock(),
            PricingEngine=MagicMock(return_value=MagicMock(status=MagicMock(return_value={}))),
            _MEM_EVO_STATE={"evo_peak_tokens": 0}, CARROT_STATE_FILE=str(self.cache_file.parent / "carrot.json"),
            EVO_STATE_FILE=str(self.cache_file.parent / "evo.json"), _MEM_OBSERVED_TS=-1.0,
        ):
            absent = scanner.build_telemetry()
            self.assertNotIn("antigravity", absent["quotas"])
            self.assertEqual(absent["quota_status"]["antigravity"]["state"], "unavailable")
            self.provider(("weekly", .95, NOW+3600))
            live = scanner.build_telemetry(force=True)
            self.assertEqual(live["quota_status"]["antigravity"]["state"], "live")
            self.assertEqual(live["quotas"]["antigravity"]["buckets"][0]["used_percent"], 5)
            self.clock.return_value = NOW+3600
            self.discovery.return_value = []
            expired = scanner.build_telemetry()
            self.assertNotIn("antigravity", expired["quotas"])
            self.assertEqual(expired["quota_status"]["antigravity"]["cache_state"], "expired")


REAL_REQUEST = scanner._antigravity_request
