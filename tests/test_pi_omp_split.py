import contextlib
import json
import os
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import scanner


class PiOmpSplitTests(unittest.TestCase):
    def setUp(self):
        stack = self.enterContext(contextlib.ExitStack())
        self.home = Path(stack.enter_context(tempfile.TemporaryDirectory()))
        self.pi_root = self.home / ".pi/agent/sessions"
        self.omp_root = self.home / ".omp/agent/sessions"
        state = self.home / "state"
        state.mkdir()
        self.cache = state / "scan.json"
        stack.enter_context(patch.dict(os.environ, {"CODEX_HOME": ""}))
        stack.enter_context(patch.multiple(
            scanner, HOME=str(self.home), CACHE_DIR=str(state),
            CACHE_FILE=str(self.cache), CONFIG_FILE=str(state / "config.json"),
            _ARCHIVE_OWNER=None, _MEM_SCAN_ARCHIVES=None,
            _MEM_FILE_CACHE=None, _MEM_SCAN_EVENTS=None, _MEM_SCAN_QUOTAS={},
            _MEM_SCAN_TS=0.0, _MEM_CODEX_ACTIVITY=0.0, _CACHE_NEEDS_SAVE=False,
            _LAST_DISK_SAVE_TS=0.0, _MEM_OBSERVED_TS=-1.0, _MEM_OBSERVED_RATES={},
        ))
        stack.callback(lambda: scanner._ARCHIVE_OWNER and scanner._ARCHIVE_OWNER.close())
        stack.enter_context(patch.object(scanner, "trigger_background_sync_if_stale"))
        stack.enter_context(patch.object(scanner, "_record_evo_telemetry", return_value=0))
        stack.enter_context(patch.object(scanner, "grokbot_activity", return_value=None))
        status = {"state": "unavailable"}
        stack.enter_context(patch.object(scanner, "select_antigravity_quota", return_value=(
            {"quota": None, "status": status}, False)))
        stack.enter_context(patch.object(scanner, "select_codex_quota", return_value=(None, status)))

    def write(self, path, tokens):
        now = datetime.now().astimezone()
        rows = [
            {"type": "session", "version": 3, "cwd": "/example", "timestamp": now.isoformat()},
            {"type": "message", "timestamp": now.isoformat(), "message": {
                "role": "assistant", "model": "gpt-5", "usage": {"input": tokens, "output": 1},
            }},
        ]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("".join(json.dumps(row) + "\n" for row in rows))
        return path

    def test_separate_filter_and_legacy_cache_migration(self):
        pi_file = self.write(self.pi_root / "project/same.jsonl", 100)
        omp_file = self.write(self.omp_root / "project/same.jsonl", 200)
        # Start with the old mixed identity already present in scan_cache_v6.
        entries = {}
        for path in (pi_file, omp_file):
            data = scanner.parse_pi_session_file(str(path))
            scanner._hydrate_parsed("omp", str(path), data)
            entries[f"omp:{path}"] = {"sig": scanner._file_sig(str(path)), "data": data}
        self.cache.write_text(json.dumps({"version": 1, "files": entries}))
        all_tools = scanner.build_telemetry("today", "all")
        self.assertEqual(all_tools["kpi"]["tokens"], 302)
        self.assertEqual(all_tools["today_tokens"], 302)
        self.assertEqual({(t["tool"], t["short"]) for t in all_tools["available_tools"]},
                         {("pi", "PI"), ("omp", "OMP")})
        for tool, expected in (("pi", 101), ("omp", 201)):
            data = scanner.build_telemetry("today", tool)
            self.assertEqual(data["kpi"]["tokens"], expected)
            self.assertEqual(data["today_tokens"], 302)
            self.assertEqual([t["tool"] for t in data["tools"]], [tool])
            self.assertEqual([c["tool"] for c in data["recent_calls"]], [tool])
            self.assertEqual(data["available_tools"], all_tools["available_tools"])
        cached = scanner._MEM_FILE_CACHE["files"]
        self.assertEqual(set(cached), {f"pi:{pi_file}", f"omp:{omp_file}"})
        self.assertEqual(cached[f"pi:{pi_file}"]["data"]["events"][0]["tool"], "pi")

    def test_mirrored_session_and_alias_do_not_double_count(self):
        pi_file = self.write(self.pi_root / "p/session.jsonl", 10)
        omp_file = self.omp_root / "p/session.jsonl"
        omp_file.parent.mkdir(parents=True)
        omp_file.write_bytes(pi_file.read_bytes())
        (self.omp_root / "alias.jsonl").symlink_to(pi_file)
        self.assertEqual(scanner.discover_pi_sessions(), [("pi", str(pi_file))])
