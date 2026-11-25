import contextlib
from datetime import datetime, timezone
import http.client
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

import scanner
import server


def usage(inp=120_000, cached=20_000, out=50_000, reasoning=30_000):
    return {"input_tokens": inp, "cached_input_tokens": cached,
            "output_tokens": out, "reasoning_output_tokens": reasoning}


def row(kind, payload, step=0):
    now = datetime.now(timezone.utc).astimezone().replace(hour=12, minute=step, second=0, microsecond=0)
    return {"type": kind, "timestamp": now.isoformat(), "payload": payload}


def token(total, last=None, step=0):
    return row("event_msg", {"type": "token_count", "info": {
        "total_token_usage": total, "last_token_usage": last}}, step)


def response(rid, amount=None):
    return row("token_usage_record", {"response_id": rid, "usage": amount or usage(909, 9, 25, 20)}, 2)


def compact(rid):
    return row("compacted", {"compaction_response_id": rid}, 3)


def jsonl(rows):
    return "".join(json.dumps(item) + "\n" for item in rows).encode()


class CodexHistoricalTests(unittest.TestCase):
    def setUp(self):
        stack = self.enterContext(contextlib.ExitStack())
        self.home = Path(stack.enter_context(tempfile.TemporaryDirectory()))
        self.override = self.home / "override"
        state = self.home / "state"
        state.mkdir()
        stack.enter_context(patch.dict(os.environ, {
            "CODEX_HOME": str(self.override), "TOOTOO_CODEX_QUOTA_AUTO": "off", "TOOTOO_AGY_CLI": "off",
        }))
        stack.enter_context(patch.multiple(
            scanner, HOME=str(self.home), CACHE_DIR=str(state), CACHE_FILE=str(state / "scan.json"),
            CONFIG_FILE=str(state / "config.json"), EVO_STATE_FILE=str(state / "evo.json"),
            CARROT_STATE_FILE=str(state / "carrot.json"), _MEM_FILE_CACHE=None, _MEM_SCAN_EVENTS=None,
            _MEM_SCAN_TS=0.0, _MEM_SCAN_QUOTAS={}, _MEM_CODEX_ACTIVITY=0, _MEM_EVO_STATE=None,
            _REAL_DAY_TOTAL=None, _MEM_OBSERVED_TS=-1.0, _MEM_OBSERVED_RATES={},
            _CACHE_NEEDS_SAVE=False, _LAST_DISK_SAVE_TS=0.0,
            trigger_background_sync_if_stale=lambda: None,
        ))
        rates = {"in": 1.0, "out": 10.0, "cr": .1, "cw": 0.0}
        stack.enter_context(patch.object(scanner.PricingEngine, "resolve", return_value=(rates, "fixture")))

    def write(self, path, rows):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(jsonl(rows))
        return path

    def compress(self, data):
        try:
            from compression import zstd
        except ImportError:
            zstd = None
        if zstd is not None:
            return zstd.compress(data)
        try:
            import zstandard
        except ImportError:
            zstandard = None
        if zstandard is not None:
            return zstandard.ZstdCompressor().compress(data)
        binary = scanner._trusted_zstd()
        if binary is None:
            self.skipTest("Zstandard decoder unavailable (safe-skip covered independently)")
        return subprocess.run([binary, "-q", "-c"], input=data, stdout=subprocess.PIPE,
                              check=True, timeout=5).stdout

    def api(self):
        with server.TooTooServer(("127.0.0.1", 0), server.TooTooHandler) as httpd:
            thread = threading.Thread(target=httpd.serve_forever, kwargs={"poll_interval": .04}, daemon=True)
            thread.start()
            client = http.client.HTTPConnection("127.0.0.1", httpd.server_port, timeout=3)
            try:
                client.request("GET", "/api/telemetry?range=all&tool=codex&force=1")
                with client.getresponse() as reply:
                    self.assertEqual(reply.status, 200)
                    return json.load(reply)
            finally:
                client.close()
                httpd.shutdown()
                thread.join(1)

    def test_actual_api_bills_output_once_keeps_reason_breakdown_and_prior_peak(self):
        main = self.home / ".codex/sessions/now.jsonl"
        self.write(main, [row("turn_context", {"model": "gpt-5"}), token(usage(), usage())])
        Path(scanner.EVO_STATE_FILE).write_text(json.dumps({
            "peak_daily_tokens": 900_000, "peak_day": scanner._local_day(), "first_day": scanner._local_day(),
        }))
        data = self.api()
        self.assertEqual(data["today_tokens"], 170_000)
        self.assertEqual(data["effective_today_tokens"], 170_000)
        self.assertEqual(data["evo_peak_tokens"], 900_000)
        self.assertEqual(data["kpi"]["tokens"], 170_000)
        self.assertEqual(data["kpi"]["out"], 20_000)
        self.assertEqual(data["kpi"]["reason"], 30_000)
        # 100k uncached at 1/M + 20k cached at .1/M + all 50k output at 10/M.
        self.assertAlmostEqual(data["recent_calls"][0]["cost"], .602)
        self.assertAlmostEqual(data["tools"][0]["cost"], .602)

    def test_compaction_requires_unchanged_bookends_and_dedupes_response_across_copies(self):
        base = usage()
        next_total = usage(120_909, 20_009, 50_025, 30_020)
        normal = self.home / ".codex/sessions/now.jsonl"
        self.write(normal, [token(base, base), response("missing"), compact("missing"), token(base, base, 4),
                            response("already-accounted"), compact("already-accounted"),
                            token(next_total, usage(909, 9, 25, 20), 5),
                            response("unmatched"), compact("not-in-ledger"), token(next_total, None, 6),
                            response("no-after"), compact("no-after")])
        fork = self.override / "archived_sessions/fork.jsonl"
        self.write(fork, [compact("copied-before-baseline"), response("copied-before-baseline"),
                          token(base), compact("missing"), token(base, None, 4), response("missing")])
        events, _, _ = scanner.scan_all_events(force=True)
        self.assertEqual([e["codex_compaction_id"] for e in events if "codex_compaction_id" in e], ["missing"])
        self.assertEqual(len(events), 3)
        data = self.api()
        self.assertEqual(data["kpi"]["tokens"], 170_000 + 2 * 934)
        self.assertEqual(data["kpi"]["requests"], 3)

    def test_compacted_without_id_requires_physical_adjacency_and_unchanged_total(self):
        base = usage()
        new_total = usage(120_001)
        self.write(self.home / ".codex/sessions/now.jsonl", [
            token(base, base), response("adjacent"), {"type": "compacted"}, token(base, None, 4),
            response("not-adjacent"), row("response_item", {"type": "message"}), row("compacted", {}), token(base, None, 5),
            response("changed"), row("compacted", {}), token(new_total, usage(1, 0, 0, 0), 6),
            response("unclosed"), row("compacted", {}),
        ])
        events, _, _ = scanner.scan_all_events(force=True)
        self.assertEqual([e["codex_compaction_id"] for e in events if "codex_compaction_id" in e], ["adjacent"])
        self.assertEqual(self.api()["kpi"]["tokens"], 170_000 + 934 + 1)

    def test_ordinary_response_suppresses_cross_file_supplement_only_by_exact_id(self):
        base = usage()
        delta = usage(909, 9, 25, 20)
        new_total = usage(120_909, 20_009, 50_025, 30_020)
        self.write(self.home / ".codex/sessions/supplement.jsonl", [
            token(base), response("accounted"), compact("accounted"), token(base, None, 4),
            response("coincidental"), compact("coincidental"), token(base, None, 6),
        ])
        credited = token(new_total, delta, 6)
        credited["payload"]["response_id"] = "accounted"
        self.write(self.override / "archived_sessions/ordinary.jsonl", [token(base), credited])
        events, _, _ = scanner.scan_all_events(force=True)
        self.assertEqual([e["codex_compaction_id"] for e in events if "codex_compaction_id" in e], ["coincidental"])
        self.assertEqual(self.api()["kpi"]["tokens"], 2 * 934)

    def test_zstd_path_rejects_untrusted_directories_and_relative_candidates(self):
        candidate = self.home / "local-tools/zstd"
        candidate.parent.mkdir()
        candidate.write_bytes(b"\x7fELF")
        candidate.chmod(0o755)
        candidate.parent.chmod(0o777)
        with patch.object(scanner.shutil, "which", return_value=str(candidate)):
            self.assertNotEqual(scanner._trusted_zstd(), str(candidate))
        with patch.object(scanner.shutil, "which", return_value="./zstd"):
            self.assertNotEqual(scanner._trusted_zstd(), os.path.realpath("./zstd"))

    def test_zstd_discovers_both_folders_and_aliases_then_reuses_size_mtime(self):
        logs = [
            self.home / ".codex/archived_sessions/archived.jsonl.zst",
            self.override / "sessions/2026/nov/new.jsonl.zst",
        ]
        compressed = self.compress(jsonl([token(usage(), usage())]))
        for path in logs:
            path.parent.mkdir(parents=True)
            path.write_bytes(compressed)
        with patch.object(scanner, "parse_codex_file", wraps=scanner.parse_codex_file) as parses:
            data = self.api()
            self.assertEqual(data["kpi"]["tokens"], 340_000)
            self.assertEqual(parses.call_count, 2)
            self.assertEqual(self.api()["kpi"]["tokens"], 340_000)
            self.assertEqual(parses.call_count, 2)
            logs[0].write_bytes(self.compress(jsonl([token(usage(1000), usage(1000))])))
            self.assertEqual(self.api()["kpi"]["requests"], 2)
            self.assertEqual(parses.call_count, 3)
        self.assertTrue(all("codex:" + str(path) in scanner._MEM_FILE_CACHE["files"] for path in logs))

    def test_missing_decoder_and_corrupt_archive_do_not_break_plain_log_or_cache_retry(self):
        plain = self.home / ".codex/sessions/ok.jsonl"
        self.write(plain, [token(usage(), usage())])
        bad = plain.with_name("corrupt.jsonl.zst")
        bad.write_bytes(b"not a frame")
        with patch.dict(sys.modules, {"compression": None, "compression.zstd": None, "zstandard": None}), \
                patch.object(scanner, "_trusted_zstd", return_value=None):
            self.assertEqual(self.api()["kpi"]["tokens"], 170_000)
            self.assertTrue(scanner._MEM_FILE_CACHE["files"]["codex:" + str(bad)]["data"]["zstd_retry"])
        compressed = self.compress(jsonl([token(usage(), usage())]))
        self.assertEqual(self.api()["kpi"]["tokens"], 170_000)  # Corrupt archive skipped by available decoder.
        bad.write_bytes(compressed)
        self.assertEqual(self.api()["kpi"]["tokens"], 340_000)

    def test_codex_cache_migration_is_per_file_not_global(self):
        path = self.home / ".codex/sessions/old.jsonl"
        self.write(path, [token(usage(), usage())])
        marker = "claude:" + str(self.home / ".claude/projects/p/session.jsonl")
        other = self.home / ".claude/projects/p/session.jsonl"
        other.parent.mkdir(parents=True)
        other.write_text("")
        scanner._save_cache({"version": 1, "files": {
            "codex:" + str(path): {"sig": scanner._file_sig(str(path)), "data": {"events": [], "quota": None}},
            marker: {"sig": scanner._file_sig(str(other)), "data": {"events": []}},
        }})
        with patch.object(scanner, "parse_codex_file", wraps=scanner.parse_codex_file) as codex, \
                patch.object(scanner, "parse_claude_file", side_effect=AssertionError("unrelated cache invalidated")):
            self.assertEqual(self.api()["kpi"]["tokens"], 170_000)
            self.assertEqual(self.api()["kpi"]["tokens"], 170_000)
            codex.assert_called_once_with(str(path))
