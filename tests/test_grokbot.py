import base64
import json
import os
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import grokbot


class GrokBotTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name).resolve()
        self.enterContext(patch.dict(os.environ, {"TOOTOO_GROKBOT_DIR": str(self.root)}))
        self.base = datetime(2026, 11, 25, 12).timestamp()
        self.day = "2026-11-25"

    def path(self, decoded):
        return self.root / (base64.b32encode(decoded.encode()).decode().rstrip("=").lower() + ".blob")

    def blob(self, acct, suffix, data):
        path = self.path(f"sand.client.slice.account.{acct}.{suffix}")
        path.write_text(json.dumps(data))
        return path

    def quota(self, acct, delta=0, expire=3600, reset=4 * 86400, used=34.17):
        ts = self.base + delta
        return self.blob(acct, "weekly-usage.cache", {"value": {
            "kind": "present", "expiresAtMs": int((self.base + expire) * 1000), "reading": {
                "readAtMs": int(ts * 1000), "usage": {"percentUsed": used,
                    "nextResetMs": int((self.base + reset) * 1000), "grokPlanLabel": "Grok Bot Plan",
                    "unifiedPlanName": "Premium", "wouldRefuseSend": False}}}})

    def event(self, delta, kind, role, rid, **extra):
        return {"kind": kind, "role": role, "timestampMs": (self.base + delta) * 1000,
                "requestId": rid, **extra}

    def activity(self, *, now=None, start=None, end=None):
        return grokbot.grokbot_activity(start or self.day, end or self.day, now=self.base + 1 if now is None else now)

    def test_latest_quota_and_same_account_metadata_only(self):
        self.quota("old", .2, used=10)
        self.quota("new", .4, used="120.4")
        self.blob("old", "transcript.replicas.old-thread", {
            "value": [self.event(0, "message", "user", "wrong")]})
        messages = [
            self.event(0, "message", "user", "r", content={
                "forbidden_marker": "never materialize this value",
                "nested": [self.event(1, "message", "user", "poison")]}),
            self.event(2, "message", "user", "r", content="q" * 70000 + "forbidden_marker"),
            self.event(5.04, "send-message", "assistant", "r"),
            self.event(6, "send-message", "assistant", "r"),
            self.event(0, "message", "user", "slow"),
            self.event(301, "send-message", "assistant", "slow"),
        ]
        selected = self.blob("new", "transcript.replicas.one", {"value": {"events": messages}})
        selected.write_text(selected.read_text().replace('"content"', '"\\u0063ontent"'))
        self.blob("new", "transcript.replicas.two", {"value": [self.event(-86400, "message", "user", "old")]})
        loader = grokbot.json.loads

        def audit(raw, **kw):
            if isinstance(raw, (bytes, bytearray)):
                self.assertNotIn(b"forbidden_marker", raw)
                self.assertNotIn(b"poison", raw)
            return loader(raw, **kw)

        with patch.object(grokbot.json, "loads", side_effect=audit):
            result = self.activity()
        self.assertEqual((result["sessions"], result["total_sessions"], result["user_messages"], result["bot_replies"]),
                         (1, 2, 3, 3))
        self.assertEqual((result["reply_latency_p50"], result["latency_samples"]), (5.04, 1))
        self.assertEqual(result["quota"]["buckets"][0]["used_percent"], 100)
        self.assertEqual(result["quota"]["source"], "local_cache")
        self.assertEqual(result["last_active_ts"], self.base + 301)
        self.assertNotIn("new", json.dumps(result))

    def test_safely_skips_secret_names_symlinks_and_malformed_docs(self):
        ignored = self.root / "sand-secrets.json"
        ignored.write_text('{"private":"ignore"}')
        self.path("sand.client.slice.account.a.credentials").write_bytes(ignored.read_bytes())
        self.path("sand.client.slice.account.a.transcript.replicas.link").symlink_to(ignored)
        os.link(ignored, self.path("sand.client.slice.account.a.transcript.replicas.hard"))
        malformed = self.path("sand.client.slice.account.a.transcript.replicas.broken")
        malformed.write_text('{"value": [')
        original = os.open
        opened = []

        def open_file(path, *a, **kw):
            if ("flags" not in kw and a and a[0] & os.O_DIRECTORY == 0 and
                    kw.get("dir_fd") is not None):
                opened.append(path)
            return original(path, *a, **kw)

        with patch.object(grokbot.os, "open", side_effect=open_file):
            self.assertIsNone(self.activity())
        self.assertEqual(opened, [malformed.name])
        other = self.root.parent / (self.root.name + "-alias")
        other.symlink_to(self.root)
        self.addCleanup(other.unlink)
        with patch.dict(os.environ, {"TOOTOO_GROKBOT_DIR": str(other)}):
            self.assertIsNone(self.activity())

    def test_expired_newest_cache_never_falls_back_to_an_older_account(self):
        self.quota("old", -20)
        self.quota("new", -5, expire=100, reset=50)
        self.blob("old", "transcript.replicas.old", [self.event(0, "message", "user", "r")])
        current = self.activity(now=self.base + 51)
        self.assertEqual(current["sessions"], 0)
        self.assertEqual(current["quota"]["state"], "expired")
        self.assertEqual(current["quota"]["reason"], "window_reset")
        self.assertEqual(current["quota"]["buckets"], [])

    def test_range_per_session_matching_and_mtime_size_memoization(self):
        edge = datetime(2026, 11, 25).timestamp() - self.base
        path = self.blob("a", "transcript.replicas.first", [
            self.event(edge - 1, "message", "user", "x"),
            self.event(edge + 1, "send-message", "assistant", "x"),
        ])
        self.blob("a", "transcript.replicas.second", [self.event(edge + 2, "send-message", "assistant", "x")])
        result = self.activity()
        self.assertEqual((result["sessions"], result["bot_replies"], result["latency_samples"]), (2, 2, 0))
        with patch.object(grokbot._MetadataJSON, "collect", side_effect=AssertionError("reparsed same file")):
            previous = self.activity(start="2026-11-24", end="2026-11-24")
        self.assertEqual((previous["sessions"], previous["reply_latency_p50"], previous["latency_samples"]), (1, 2.0, 1))
        path.write_text(json.dumps([self.event(0, "message", "user", "changed")]))
        latest = self.activity()
        self.assertEqual(latest["user_messages"], 1)


if __name__ == "__main__":
    unittest.main()
