"""Real packaged telemetry for a disposable Grok Bot store (no accounts or network)."""
import base64
import json
import os
from pathlib import Path
import sys
import tempfile
import time

from xp_boost_packaged_http import request, serve


def blob(path, key, body):
    name = base64.b32encode(key.encode("ascii")).decode("ascii").strip("=").lower()
    file = path / (name + ".blob")
    file.write_text(json.dumps(body), encoding="utf-8")
    return file


def main(resources):
    with tempfile.TemporaryDirectory(prefix="tootoo-grokbot-fixture-") as tmp:
        home = Path(tmp).resolve()  # macOS /var may be a symlink; Grok rejects symlinked ancestors.
        store = home / "isolated-store"
        store.mkdir()
        env = dict(os.environ, HOME=str(home), TOOTOO_HOME=str(home / "tootoo"),
                   CODEX_HOME=str(home / "codex"), TOOTOO_GROKBOT_DIR=str(store),
                   TOOTOO_AGY_CLI="off", TOOTOO_CODEX_QUOTA_AUTO="off", TOOTOO_DEBUG="0",
                   PYTHONDONTWRITEBYTECODE="1", TZ="UTC")
        now_ms = int(time.time() * 1000)
        private_text = "private-prompt-fixture-must-not-appear"
        private_id = "fixture-private-account-must-not-appear"
        base = "sand.client.slice.account." + private_id
        cache = {"value": {"kind": "present", "expiresAtMs": now_ms + 600_000, "reading": {
            "readAtMs": now_ms - 20_000, "usage": {"percentUsed": "63",
            "nextResetMs": now_ms + 3_600_000, "grokPlanLabel": "Fixture Plan"},
        }}}
        quota_file = blob(store, base + ".weekly-usage.cache", cache)
        blob(store, base + ".transcript.replicas.test", [
            {"kind": "message", "role": "user", "timestampMs": now_ms - 5000,
             "requestId": "linked-request", "content": private_text},
            {"kind": "send-message", "timestampMs": now_ms - 3000, "requestId": "linked-request",
             "content": private_text},
        ])
        path = "/api/telemetry?range=week&tool=all"
        with serve(resources, env) as url:
            live = request(url, path)
            quota = live["quotas"]["grokbot"]
            assert quota["buckets"][0]["key"] == "grokbot:weekly", quota
            assert quota["buckets"][0]["used_percent"] == 63, quota
            assert live["kpi"]["tokens"] == live["kpi"]["cost"] == 0, live["kpi"]
            for private in (private_id, private_text, "linked-request"):
                assert private not in json.dumps(live), "raw Grok account/content leaked to telemetry"
            # Keep nextReset in the future; cache expiry alone must hide the percentage.
            cache["value"]["expiresAtMs"] = now_ms - 5000
            quota_file.write_text(json.dumps(cache), encoding="utf-8")
            expired = request(url, path + "&force=1")
            quota = expired["quotas"].get("grokbot") or {}
            assert not quota.get("buckets"), quota
            assert expired["kpi"]["tokens"] == expired["kpi"]["cost"] == 0, expired["kpi"]
    print("PASS packaged Grok Bot HTTP local synthetic quota, no private content, no fake KPI, expires cleanly")


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
