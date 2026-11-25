"""Exercise the archive backfill through the same loopback API/CLI as TooToo."""
from contextlib import contextmanager, ExitStack
from datetime import datetime, timedelta, timezone
import hashlib
import http.client
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

import scanner
import server
import test_codex_historical as fixtures


class CodexArchivePerformanceTests(unittest.TestCase):
    compress = fixtures.CodexHistoricalTests.compress
    write = fixtures.CodexHistoricalTests.write

    def setUp(self):
        fixtures.CodexHistoricalTests.setUp(self)
        self.enterContext(patch.multiple(scanner, _ARCHIVE_OWNER=None, _MEM_SCAN_ARCHIVES=None))
        self.addCleanup(self.wait_archive)
        self.now = datetime.now(timezone.utc).astimezone().replace(hour=12, minute=0, second=0, microsecond=0)
        self.plain = self.override / "sessions/today.jsonl"

    def wait_archive(self):
        if scanner._ARCHIVE_OWNER is not None:
            scanner._ARCHIVE_OWNER.wait()

    def data(self, days, count, model="gpt-5", project="/synthetic/project"):
        when = self.now - timedelta(days=days)
        rows = [{"type": "turn_context", "payload": {"model": model, "cwd": project}}]
        for i in range(count):
            start = when + timedelta(minutes=i)
            first = start + timedelta(seconds=2)
            rows.append({"type": "event_msg", "timestamp": start.isoformat(), "payload": {"type": "task_started"}})
            rows.append({"type": "event_msg", "payload": {
                "type": "item_completed", "item": "AgentMessage", "started_at_ms": int(first.timestamp() * 1000),
            }})
            usage = fixtures.usage(600 + i, 100, 120, 50)
            row = fixtures.token(usage, usage)
            row["timestamp"] = (first + timedelta(seconds=3)).isoformat()
            rows.append(row)
        return rows

    def archive(self, name, days, count, age=None, **kw):
        path = self.override / "archived_sessions" / f"{name}.jsonl.zst"
        path.parent.mkdir(parents=True, exist_ok=True)
        rows = self.data(days, count, **kw)
        path.write_bytes(self.compress(fixtures.jsonl(rows)))
        ts = (self.now - timedelta(days=days if age is None else age)).timestamp()
        os.utime(path, (ts, ts))
        return path, rows

    @contextmanager
    def httpd(self):
        with server.TooTooServer(("127.0.0.1", 0), server.TooTooHandler) as httpd:
            thread = threading.Thread(target=httpd.serve_forever, kwargs={"poll_interval": .02}, daemon=True)
            thread.start()
            try:
                yield httpd
            finally:
                httpd.shutdown()
                thread.join(1)

    def request(self, httpd, key="today", force=False):
        with self.client(httpd) as client:
            client.request("GET", f"/api/telemetry?range={key}&tool=all&force={int(force)}")
            with client.getresponse() as reply:
                self.assertEqual(reply.status, 200)
                return json.load(reply)

    @contextmanager
    def client(self, httpd):
        connection = http.client.HTTPConnection("127.0.0.1", httpd.server_port, timeout=4)
        try:
            yield connection
        finally:
            connection.close()

    def test_cold_http_returns_while_decoder_is_blocked_then_sse_backfills_and_hot_write_cannot_touch_archive(self):
        self.write(self.plain, self.data(0, 1))
        self.archive("a", 10, 4)
        self.archive("b", 40, 6)
        original = scanner.parse_codex_file
        involved, release = threading.Event(), threading.Event()

        def blocked(path):
            if path.endswith(".zst"):
                self.assertEqual(threading.current_thread().name, "codex-archive-scan")
                involved.set()
                self.assertTrue(release.wait(8))
            return original(path)

        try:
            with patch.object(scanner, "parse_codex_file", side_effect=blocked), self.httpd() as httpd:
                today = self.request(httpd)
                self.assertTrue(involved.wait(1))
                self.assertTrue(today["history_pending"])
                self.assertEqual(today["kpi"]["requests"], 1)
                partial = self.request(httpd, "all")
                self.assertEqual(partial["kpi"]["requests"], 1)
                with self.client(httpd) as client:
                    cursor = partial["quota_version"]
                    client.request("GET", f"/api/stream?range=30d&skip_initial=1&since_quota_version={cursor}")
                    with client.getresponse() as reply:
                        self.assertEqual(reply.status, 200)
                        release.set()
                        line = reply.readline()
                        self.assertTrue(line.startswith(b"data: "), line)
                        payload = json.loads(line[6:])
                        self.assertEqual(payload["kpi"]["requests"], 5)
                        self.assertFalse(payload["history_pending"])
                complete = self.request(httpd, "all")
                self.assertEqual(complete["kpi"]["requests"], 11)
                self.assertEqual(len(complete["daily"]), 3)
                self.assertEqual(sum(b["count"] for b in complete["ttft_histogram"]), 11)
                db = Path(scanner._ARCHIVE_OWNER.db_path)
                before = (db.stat().st_mtime_ns, hashlib.sha256(db.read_bytes()).digest())
                self.write(self.plain, self.data(0, 2))
                # This guards accumulated event work, not just elapsed time:
                # even a forced metadata rescan may not expand any cold row.
                with patch.object(scanner._ArchivedCodex, "event", side_effect=AssertionError("today walked archive")):
                    after = self.request(httpd, force=True)
                    self.assertEqual(after["kpi"]["requests"], 2)
                self.assertEqual((db.stat().st_mtime_ns, hashlib.sha256(db.read_bytes()).digest()), before)
                hot = Path(scanner.CACHE_FILE).read_text()
                self.assertNotIn(".jsonl.zst", hot)
                # Reload from the durable cache without decoding original files.
                self.wait_archive()
                scanner._ARCHIVE_OWNER = None
                scanner._MEM_SCAN_EVENTS = None
                with patch.object(scanner, "parse_codex_file", side_effect=AssertionError("cache was not reused")):
                    self.assertEqual(scanner.build_telemetry("all", wait_for_history=True)["kpi"]["requests"], 12)
        finally:
            release.set()

    def test_complete_ranges_match_ordinary_jsonl_exactly_including_pricing_tape_and_histogram(self):
        self.write(self.plain, self.data(0, 2))
        first = self.archive("older-a", 10, 7, model="gpt-5-mini")
        second = self.archive("older-b", 40, 6, project="/synthetic/other")
        archive = {key: scanner.build_telemetry(key, wait_for_history=True) for key in ("today", "30d", "all")}
        for path, rows in (first, second):
            path.unlink()
            self.write(path.with_suffix(""), rows)
        for key, prior in archive.items():
            current = scanner.build_telemetry(key, force=True)
            for field in ("available_tools", "kpi", "ttft_histogram", "daily", "hourly",
                          "tools", "models", "recent_calls", "projects", "pricing_status", "today_tokens"):
                self.assertEqual(prior[field], current[field], (key, field))

    def test_recent_archive_inventory_has_a_fixed_foreground_budget(self):
        self.write(self.plain, self.data(0, 1))
        recent = self.override / "sessions"
        total = scanner._CODEX_SYNC_ZSTD_MAX_FILES + 7
        for i in range(total):
            (recent / f"fresh-{i}.jsonl.zst").write_bytes(b"synthetic")
        blocked, release = threading.Event(), threading.Event()
        foreground, workers = [], []
        original = scanner.parse_codex_file

        def parse(path):
            if not path.endswith(".zst"):
                return original(path)
            if threading.current_thread() is threading.main_thread():
                foreground.append(path)
            else:
                blocked.set()
                release.wait(8)
                workers.append(path)
            return {"events": [], "codex_parser_rev": scanner._CODEX_PARSER_REV}

        try:
            with patch.object(scanner, "parse_codex_file", side_effect=parse):
                self.assertEqual(scanner.build_telemetry("today")["kpi"]["requests"], 1)
                self.assertTrue(blocked.wait(1))
                self.assertEqual(len(foreground), scanner._CODEX_SYNC_ZSTD_MAX_FILES)
                release.set()
                self.wait_archive()
                self.assertEqual(len(workers), total - len(foreground))
        finally:
            release.set()

    def test_missing_decoder_ends_pending_state_without_permanently_capping_xp(self):
        base = fixtures.usage()
        self.write(self.plain, [fixtures.token(base, base), fixtures.response("supplement"),
                                fixtures.compact("supplement"), fixtures.token(base, None, 4)])
        old = self.override / "archived_sessions/no-decoder.jsonl.zst"
        old.parent.mkdir()
        old.write_bytes(b"fixture")
        ts = (self.now - timedelta(days=20)).timestamp()
        os.utime(old, (ts, ts))
        original = scanner.parse_codex_file
        release = threading.Event()

        def missing(path):
            if path.endswith(".zst"):
                release.wait(8)
                return {"events": [], "zstd_retry": True}
            return original(path)

        try:
            with patch.object(scanner, "parse_codex_file", side_effect=missing):
                first = scanner.build_telemetry("today")
                self.assertTrue(first["history_pending"])
                self.assertEqual(first["today_tokens"], 170_934)
                self.assertEqual(first["evo_peak_tokens"], 170_000)
                release.set()
                final = scanner.build_telemetry("today", wait_for_history=True)
                self.assertFalse(final["history_pending"])
                self.assertEqual(final["history_unavailable"], 1)
                self.assertEqual(final["evo_peak_tokens"], 170_934)
        finally:
            release.set()

    def test_one_shot_cli_waits_for_historical_totals(self):
        self.write(self.plain, self.data(0, 1))
        self.archive("historic", 12, 3)
        state = Path(scanner.CACHE_DIR)
        script = ("import scanner,server; scanner.trigger_background_sync_if_stale=lambda:None;"
                  "server.main()")
        proc = subprocess.run([sys.executable, "-c", script, "--json", "--range", "all", "--tool", "codex"],
                              cwd=Path(scanner.__file__).parent,
                              env={**os.environ, "HOME": str(self.home), "TOOTOO_HOME": str(state)},
                              text=True, capture_output=True, timeout=10, check=True)
        returned = json.loads(proc.stdout)
        self.assertEqual(returned["kpi"]["requests"], 4)
        self.assertFalse(returned["history_pending"])


if __name__ == "__main__":
    unittest.main()
