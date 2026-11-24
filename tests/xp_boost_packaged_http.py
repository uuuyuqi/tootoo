"""Smoke-test packaged HTTP/scanner code with isolated local logs and app state."""
from datetime import datetime, time, timedelta, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from urllib.request import Request, urlopen


SERVER = """
from server import TooTooServer, TooTooHandler
import scanner
# No remote background pricing traffic. HTTP, log parser, and disk writes are real.
scanner.trigger_background_sync_if_stale = lambda: None
with TooTooServer(('127.0.0.1', 0), TooTooHandler) as server:
    print(server.server_port, flush=True)
    server.serve_forever()
"""


@contextmanager
def serve(resources, env):
    with subprocess.Popen([sys.executable, "-u", "-c", SERVER], cwd=resources,
                          env=env, stdout=subprocess.PIPE, text=True) as process:
        try:
            port = int(process.stdout.readline().strip())
            yield f"http://127.0.0.1:{port}"
        finally:
            process.terminate()
            process.wait(timeout=8)


def request(base, path, value=None):
    data = None if value is None else json.dumps(value).encode()
    with urlopen(Request(base + path, data=data, headers={"Content-Type": "application/json"}), timeout=8) as reply:
        return json.load(reply)


def main():
    resources = Path(sys.argv[1]).resolve()
    with tempfile.TemporaryDirectory() as scratch:
        home = Path(scratch)
        state = home / "state"
        codex = home / "codex"
        env = dict(os.environ, HOME=str(home), TOOTOO_HOME=str(state), CODEX_HOME=str(codex),
                   TOOTOO_AGY_CLI="off", TOOTOO_CODEX_QUOTA_AUTO="off", TOOTOO_DEBUG="0",
                   PYTHONDONTWRITEBYTECODE="1", TZ="UTC")
        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)
        log = codex / "sessions" / "rollout.jsonl"
        log.parent.mkdir(parents=True)
        log.write_text(json.dumps({
            "timestamp": datetime.combine(today, time(), timezone.utc).isoformat(),
            "type": "event_msg",
            "payload": {"type": "token_count", "info": {"last_token_usage": {"input_tokens": 99_000_000}}},
        }) + "\n")
        path = "/api/telemetry?range=today&tool=all"
        evo = state / "evo_state.json"
        with serve(resources, env) as base:
            before = request(base, path)
            assert before["today_tokens"] == before["kpi"]["tokens"] == 99_000_000, before
            assert before["evo_peak_tokens"] == 99_000_000, before
            post = request(base, "/api/carrot", {"home": {"xp_boost": {"day": str(today), "tokens": 2_000_000}}})
            assert post["ok"] and post["home"]["xp_boost"]["tokens"] == 2_000_000, post
            # Check before another telemetry request, which could hide a delayed write bug.
            assert json.loads(evo.read_text())["peak_daily_tokens"] == 101_000_000
            after = request(base, path)
            assert after["evo_peak_tokens"] == 101_000_000, after
            assert after["today_tokens"] == after["kpi"]["tokens"] == 99_000_000, after
            expired = request(base, "/api/carrot", {"home": {"xp_boost": {"day": str(yesterday), "tokens": 10_000_000}}})
            assert expired["ok"], expired
        log.unlink()
        with serve(resources, env) as base:
            cold = request(base, path)
            assert cold["today_tokens"] == cold["kpi"]["tokens"] == 0, cold
            assert cold["evo_peak_tokens"] == 101_000_000, cold
        assert json.loads(evo.read_text())["peak_daily_tokens"] == 101_000_000
    print("Packaged HTTP XP boost: durable before next poll, expiry/restart preserve peak, KPI unchanged")


if __name__ == "__main__":
    main()
