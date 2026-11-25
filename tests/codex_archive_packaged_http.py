"""Exercise the real HTTP server with 5,155 synthetic compressed Codex logs."""
from datetime import datetime, timedelta, timezone
import hashlib
import http.client
import json
import os
from pathlib import Path
import statistics
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlsplit

from xp_boost_packaged_http import request, serve


TOKENS = 1_000
ARCHIVES = 5_155
ROWS = 40
RECENT_ARCHIVES = 100


def body(when, count):
    return "".join(json.dumps({
        "type": "event_msg",
        "timestamp": (when + timedelta(seconds=i)).isoformat(),
        "payload": {"type": "token_count", "info": {
            "last_token_usage": {"input_tokens": TOKENS},
        }},
    }) + "\n" for i in range(count)).encode()


def compress(data):
    try:
        from compression import zstd
    except ImportError:
        return subprocess.run(["zstd", "-q", "-c"], input=data, capture_output=True,
                              check=True, timeout=10).stdout
    return zstd.compress(data)


def timed(base, period):
    start = time.perf_counter()
    data = request(base, f"/api/telemetry?range={period}&tool=codex")
    return (time.perf_counter() - start) * 1000, data


def wait_for_sse(base, version, expected):
    url = urlsplit(base)
    client = http.client.HTTPConnection(url.hostname, url.port, timeout=15)
    try:
        client.request("GET", f"/api/stream?range=30d&tool=codex&skip_initial=1&since_quota_version={version}")
        with client.getresponse() as reply:
            assert reply.status == 200, reply.status
            until = time.monotonic() + 180
            while time.monotonic() < until:
                line = reply.readline()
                if not line:
                    raise AssertionError("SSE closed before history arrived")
                if line.startswith(b"data: "):
                    payload = json.loads(line[6:])
                    if payload["kpi"]["requests"] == expected:
                        return
            raise AssertionError("SSE never delivered complete 30-day Codex history")
    finally:
        client.close()


def main(resources):
    with tempfile.TemporaryDirectory(prefix="tootoo-archive-fixture-") as tmp:
        home = Path(tmp).resolve()
        state = home / "state"
        state.mkdir()
        legacy = state / "scan_cache_v5.json"
        with legacy.open("wb") as handle:
            handle.write(b'{"version":1,"files":{}}')
            for _ in range(74):
                handle.write(b" " * 1_000_000)
        codex = home / "codex"
        env = dict(os.environ, HOME=str(home), TOOTOO_HOME=str(state), TOOTOO_DATA_DIR=str(state),
                   CODEX_HOME=str(codex), TOOTOO_AGY_CLI="off", TOOTOO_CODEX_QUOTA_AUTO="off",
                   TOOTOO_DEBUG="0", PYTHONDONTWRITEBYTECODE="1", TZ="UTC")
        today = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)
        plain = codex / "sessions" / "today.jsonl"
        plain.parent.mkdir(parents=True)
        plain.write_bytes(body(today, 1))
        archive = codex / "archived_sessions"
        archive.mkdir()
        recent = today - timedelta(days=10)
        old = today - timedelta(days=40)
        payloads = (compress(body(recent, ROWS)), compress(body(old, ROWS)))
        for i in range(ARCHIVES):
            use_recent = i < RECENT_ARCHIVES
            file = archive / f"history-{i:05}.jsonl.zst"
            file.write_bytes(payloads[0 if use_recent else 1])
            file_time = (recent if use_recent else old).timestamp()
            os.utime(file, (file_time, file_time))
        all_requests = 1 + ARCHIVES * ROWS
        with serve(resources, env) as base:
            cold_today, first = timed(base, "today")
            cold_all, partial = timed(base, "all")
            assert first["kpi"]["requests"] == 1 and first["today_tokens"] == TOKENS, first["kpi"]
            assert 1 <= partial["kpi"]["requests"] <= all_requests, partial["kpi"]
            assert cold_today < 1500 and cold_all < 1500, (cold_today, cold_all)
            wait_for_sse(base, partial["quota_version"], 1 + RECENT_ARCHIVES * ROWS)
            until = time.monotonic() + 180
            while True:
                all_ms, complete = timed(base, "all")
                if complete["kpi"]["requests"] == all_requests:
                    break
                assert time.monotonic() < until, complete["kpi"]
                time.sleep(.25)
            assert complete["kpi"]["tokens"] == all_requests * TOKENS, complete["kpi"]
            assert complete["today_tokens"] == TOKENS, complete["kpi"]
            assert len(complete["daily"]) == 3, complete["daily"]
            hot_samples = [timed(base, "today")[0] for _ in range(15)]
            hot_median = statistics.median(hot_samples)
            assert hot_median < 50, hot_samples
            time.sleep(5.1)
            rescan_ms, _ = timed(base, "today")
            db = state / "codex_archive_v1.sqlite3"
            with db.open("rb") as stored:
                before = hashlib.file_digest(stored, "sha256").hexdigest()
            before_mtime = db.stat().st_mtime_ns
            plain.write_bytes(body(today, 2))
            changed = request(base, "/api/telemetry?range=today&tool=codex&force=1")
            assert changed["today_tokens"] == 2 * TOKENS, changed["kpi"]
            sizes = {p.name: p.stat().st_size for p in state.iterdir() if p.is_file()}
            with db.open("rb") as stored:
                assert hashlib.file_digest(stored, "sha256").hexdigest() == before, sizes
            assert db.stat().st_mtime_ns == before_mtime, sizes
            assert 0 < sizes.get("scan_cache_v6.json", 0) < 1_000_000, sizes
            assert not legacy.exists(), sizes
        print(f"PASS packaged Codex archives: {ARCHIVES} files, {all_requests - 1} events; "
              f"cold today/all={cold_today:.1f}/{cold_all:.1f} ms, hot today median={hot_median:.1f} ms, "
              f"today after scan TTL={rescan_ms:.1f} ms, complete all={all_ms:.1f} ms, cache bytes={sizes}")


if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve())
