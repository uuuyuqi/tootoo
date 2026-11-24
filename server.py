#!/usr/bin/env python3
"""
tootoo Server & CLI — Local HTTP server + SSE live stream + Terminal telemetry summary.
Zero external dependencies (Python 3 stdlib only).
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import signal
import socketserver
import sys
import threading
import time
import urllib.request
import uuid
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from agy_cli_quota import stop_agy_cli_quota
from pricing import sync_remote_pricing
from update_check import checker as update_checker
from scanner import CACHE_DIR, build_telemetry, load_carrot_state, save_carrot_state, save_local_quota_config

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UI_FILE = os.path.join(BASE_DIR, "ui", "index.html")
BUNNY_LINES_FILE = os.path.join(BASE_DIR, "ui", "bunny_lines.json")
WEATHER_CACHE_FILE = os.path.join(CACHE_DIR, "weather_cache.json")


def _is_dev_debug_enabled() -> bool:
    """Enable dev debug tools only in source development mode (or explicit TOOTOO_DEBUG=1)."""
    if os.path.exists(os.path.join(BASE_DIR, ".release")):
        return False
    env_val = os.environ.get("TOOTOO_DEBUG")
    if env_val is not None:
        return env_val.strip().lower() in ("1", "true", "yes", "on")
    if ".app/Contents/Resources" in BASE_DIR.replace("\\", "/"):
        return False
    return True


DEV_DEBUG_ENABLED = _is_dev_debug_enabled()

_WEATHER_LOCK = threading.Lock()
_WEATHER_CACHE: dict | None = None
_WEATHER_NEXT_TS = 0.0
_WEATHER_TTL = 1200.0  # 20 min
_WEATHER_RETRY_TTL = 180.0

_SNOW_CODES = {
    179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338,
    350, 362, 365, 368, 371, 374, 377, 392, 395,
}
_RAIN_CODES = {
    176, 200, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314,
    353, 356, 359, 386, 389,
}
_OVERCAST_CODES = {122, 143, 248, 260}
_WEATHER_META = {
    "sunny":    ("☀️", "晴天"),
    "cloudy":   ("⛅", "多云"),
    "overcast": ("☁️", "阴天"),
    "windy":    ("🍃", "刮风"),
    "rain":     ("🌧️", "下雨"),
    "snow":     ("❄️", "下雪"),
}


def _classify_wwo_weather(code: int, cloud_cover: int, wind_kmph: int, precip_mm: float) -> str:
    if code in _SNOW_CODES:
        return "snow"
    if code in _RAIN_CODES or precip_mm >= 0.3:
        return "rain"
    if wind_kmph >= 24:
        return "windy"
    if code in _OVERCAST_CODES or cloud_cover >= 82:
        return "overcast"
    if code == 116 or cloud_cover >= 28:
        return "cloudy"
    return "sunny"


def _load_disk_weather() -> dict | None:
    try:
        if os.path.exists(WEATHER_CACHE_FILE):
            with open(WEATHER_CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and data.get("kind") in _WEATHER_META:
                return data
    except Exception:
        pass
    return None


def _save_disk_weather(payload: dict) -> None:
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        tmp = WEATHER_CACHE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False)
        os.replace(tmp, WEATHER_CACHE_FILE)
    except OSError:
        pass


def fetch_local_weather(force: bool = False) -> dict:
    global _WEATHER_CACHE, _WEATHER_NEXT_TS
    now = time.monotonic()
    with _WEATHER_LOCK:
        if _WEATHER_CACHE is None:
            _WEATHER_CACHE = _load_disk_weather()
        if not force and _WEATHER_CACHE and now < _WEATHER_NEXT_TS:
            return _WEATHER_CACHE
        if not force and _WEATHER_CACHE is None and now < _WEATHER_NEXT_TS:
            return {"ok": False, "kind": "sunny", "icon": "☀️", "label": "晴天", "temp_c": None, "city": ""}

    fetched: dict | None = None
    try:
        req = urllib.request.Request(
            "https://wttr.in/?format=j1",
            headers={"User-Agent": "tootoo-weather/1.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=4.5) as resp:
            raw = resp.read(262144).decode("utf-8", errors="ignore")
        doc = json.loads(raw)
        cc = (doc.get("current_condition") or [{}])[0]
        na = (doc.get("nearest_area") or [{}])[0]
        code = int(cc.get("weatherCode") or 113)
        cloud = int(cc.get("cloudcover") or 0)
        wind = int(cc.get("windspeedKmph") or 0)
        precip = float(cc.get("precipMM") or 0.0)
        temp_c = int(round(float(cc.get("temp_C") or 0)))
        city_arr = na.get("areaName") or []
        city = str((city_arr[0] or {}).get("value") or "").strip() if city_arr else ""
        kind = _classify_wwo_weather(code, cloud, wind, precip)
        icon, label = _WEATHER_META[kind]
        fetched = {
            "ok": True,
            "kind": kind,
            "icon": icon,
            "label": label,
            "temp_c": temp_c,
            "wind_kmph": wind,
            "cloud_cover": cloud,
            "city": city,
            "updated_at": int(time.time()),
        }
    except Exception:
        fetched = None

    with _WEATHER_LOCK:
        if fetched:
            _WEATHER_CACHE = fetched
            _WEATHER_NEXT_TS = time.monotonic() + _WEATHER_TTL
            _save_disk_weather(fetched)
            return fetched
        _WEATHER_NEXT_TS = time.monotonic() + _WEATHER_RETRY_TTL
        if _WEATHER_CACHE:
            return {**_WEATHER_CACHE, "cached": True}
        return {"ok": False, "kind": "sunny", "icon": "☀️", "label": "晴天", "temp_c": None, "city": ""}


def fmt_num(n: int | float) -> str:
    n = float(n)
    if n >= 1_000_000_000:
        return f"{n / 1e9:.2f}B"
    if n >= 1_000_000:
        return f"{n / 1e6:.2f}M"
    if n >= 1_000:
        return f"{n / 1e3:.1f}K"
    return str(int(n))


def print_cli_report(range_key: str, tool_filter: str) -> None:
    data = build_telemetry(range_key=range_key, tool_filter=tool_filter)
    kpi = data["kpi"]

    bold = "\033[1m"
    dim = "\033[2m"
    red = "\033[38;5;166m"
    teal = "\033[38;5;36m"
    amber = "\033[38;5;172m"
    reset = "\033[0m"

    print(f"\n{bold}TOOTOO // VIBE TELEMETRY{reset}  {dim}[range={range_key} | tool={tool_filter} | scan={data['scan_ms']}ms]{reset}")
    print("─" * 78)
    tps_s = f"{kpi['tps']} tok/s" if kpi["tps"] is not None else "—"
    p50_s = f"{kpi['ttft_p50']}s" if kpi["ttft_p50"] is not None else "—"
    p95_s = f"{kpi['ttft_p95']}s" if kpi["ttft_p95"] is not None else "—"

    print(
        f"  Tokens: {bold}{fmt_num(kpi['tokens'])}{reset}  "
        f"{dim}(in {fmt_num(kpi['in'])} / out {fmt_num(kpi['out'])} / cache {fmt_num(kpi['cr'])} · {kpi['cache_hit']}% hit){reset}"
    )
    print(
        f"  Speed:  {teal}{bold}{tps_s}{reset}   "
        f"TTFT P50: {amber}{bold}{p50_s}{reset}   "
        f"P95: {red}{bold}{p95_s}{reset}   "
        f"Est. Cost: {bold}${kpi['cost']:.2f}{reset}   "
        f"Reqs: {kpi['requests']} ({kpi['sessions']} sessions)"
    )

    if data["tools"]:
        print(f"\n{bold}AGENTS{reset}")
        print(f"  {'AGENT':<20} {'TOKENS':>10} {'CACHE':>7} {'TPS':>10} {'TTFT P50':>9} {'COST':>8} {'REQS':>6}")
        for t in data["tools"]:
            t_tps = f"{t['tps']:.1f}/s" if t["tps"] is not None else "—"
            t_p50 = f"{t['ttft_p50']:.2f}s" if t["ttft_p50"] is not None else "—"
            print(
                f"  {t['label']:<20} {fmt_num(t['tokens']):>10} {t['cache_hit']:>6.1f}% "
                f"{t_tps:>10} {t_p50:>9} ${t['cost']:>7.2f} {t['requests']:>6}"
            )

    if data["models"]:
        print(f"\n{bold}TOP MODELS (BY TOKENS){reset}")
        print(f"  {'MODEL':<32} {'TOKENS':>10} {'TPS':>10} {'TTFT P50':>9} {'SAMPLES':>7} {'COST':>8}")
        for m in data["models"][:10]:
            m_tps = f"{m['tps']:.1f}/s" if m["tps"] is not None else "—"
            m_p50 = f"{m['ttft_p50']:.2f}s" if m["ttft_p50"] is not None else "—"
            print(
                f"  {m['model'][:31]:<32} {fmt_num(m['tokens']):>10} "
                f"{m_tps:>10} {m_p50:>9} {m['perf_samples']:>7} ${m['cost']:>7.2f}"
            )
    print()


class TooTooHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        # Keep terminal quiet unless error
        pass

    def _send_json(self, payload: dict, status: int = 200, *, update_challenge: str | None = None) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        nonce = os.environ.get("TOOTOO_UPDATE_NONCE")
        if update_challenge and nonce:
            proof = hmac.new(nonce.encode("utf-8"), update_challenge.encode("ascii") + b"\x00" + body,
                             hashlib.sha256).hexdigest()
            self.send_header("X-TooToo-Update-Proof", proof)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/update":
            if self.headers.get("Sec-Fetch-Site") == "cross-site":
                self._send_json({"error": "Cross-site update checks are not allowed."}, status=403)
                return
            state = update_checker.check(force=parse_qs(parsed.query).get("force") == ["1"])
            challenge = self.headers.get("X-TooToo-Update-Challenge", "")
            try:
                challenge = challenge if len(challenge) == 36 and str(uuid.UUID(challenge)).upper() == challenge else None
            except ValueError:
                challenge = None
            # The child backend proves its identity without exposing the secret
            # to a loopback client or a replacement process on the same port.
            self._send_json(state, update_challenge=challenge)
            return
        if parsed.path in ("/", "/index.html"):
            try:
                with open(UI_FILE, "rb") as f:
                    html = f.read()
                flag_js = (
                    b"<script>window.__TOOTOO_DEV_DEBUG__="
                    + (b"true" if DEV_DEBUG_ENABLED else b"false")
                    + b";</script></head>"
                )
                html = html.replace(b"</head>", flag_js, 1)
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(html)))
                self.end_headers()
                self.wfile.write(html)
            except OSError as e:
                self._send_json({"error": str(e)}, status=500)
            return

        if parsed.path.startswith("/ui/") and (parsed.path.endswith(".js") or parsed.path.endswith(".json")):
            rel = parsed.path[len("/ui/"):]
            ui_root = os.path.realpath(os.path.join(BASE_DIR, "ui"))
            target = os.path.realpath(os.path.join(ui_root, rel))
            if target.startswith(ui_root + os.sep) and os.path.isfile(target):
                try:
                    with open(target, "rb") as f:
                        blob = f.read()
                    ctype = "application/javascript; charset=utf-8" if target.endswith(".js") else "application/json; charset=utf-8"
                    self.send_response(HTTPStatus.OK)
                    self.send_header("Content-Type", ctype)
                    self.send_header("Cache-Control", "no-store")
                    self.send_header("Content-Length", str(len(blob)))
                    self.end_headers()
                    self.wfile.write(blob)
                except OSError as e:
                    self._send_json({"error": str(e)}, status=500)
                return

        if parsed.path == "/api/bunny_lines":
            try:
                with open(BUNNY_LINES_FILE, "r", encoding="utf-8") as f:
                    lines = json.load(f)
                if not isinstance(lines, list):
                    lines = []
                self._send_json({"lines": lines})
            except OSError:
                self._send_json({"lines": []})
            return

        if parsed.path == "/api/carrot":
            try:
                self._send_json(load_carrot_state())
            except Exception as e:
                self._send_json({"days": {}, "collection": [], "error": str(e)}, status=500)
            return

        if parsed.path == "/api/weather":
            qs = parse_qs(parsed.query)
            force = qs.get("force", ["0"])[0] == "1"
            try:
                self._send_json(fetch_local_weather(force=force))
            except Exception as e:
                self._send_json({"ok": False, "kind": "sunny", "icon": "☀️", "label": "晴天", "error": str(e)})
            return

        if parsed.path == "/api/pricing/refresh":
            try:
                res = sync_remote_pricing(force=True)
                self._send_json({
                    "ok": True,
                    "count": res.get("count", 0),
                    "sources": res.get("sources", []),
                    "updated_at": res.get("updated_at"),
                })
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, status=500)
            return

        if parsed.path == "/api/telemetry":
            qs = parse_qs(parsed.query)
            r_key = qs.get("range", ["7d"])[0]
            t_flt = qs.get("tool", ["all"])[0]
            force = qs.get("force", ["0"])[0] == "1"
            rebuild = qs.get("rebuild", ["0"])[0] == "1"
            try:
                data = build_telemetry(range_key=r_key, tool_filter=t_flt, force=force, rebuild=rebuild)
                self._send_json(data)
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)
            return

        if parsed.path == "/api/stream":
            qs = parse_qs(parsed.query)
            r_key = qs.get("range", ["7d"])[0]
            t_flt = qs.get("tool", ["all"])[0]
            skip_initial = qs.get("skip_initial", ["0"])[0] == "1"
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            try:
                if skip_initial:
                    time.sleep(20)
                while True:
                    data = build_telemetry(range_key=r_key, tool_filter=t_flt)
                    msg = f"data: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")
                    self.wfile.write(msg)
                    self.wfile.flush()
                    time.sleep(20)
            except (BrokenPipeError, ConnectionResetError, OSError):
                return

        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/quota/config":
            try:
                length = int(self.headers.get("Content-Length", "0") or "0")
                raw = self.rfile.read(min(length, 65536))
                body = json.loads(raw.decode("utf-8"))
                tool = str(body.get("tool") or "").strip()
                if not tool:
                    self._send_json({"ok": False, "error": "missing tool"}, status=400)
                    return
                if body.get("reset"):
                    lq = save_local_quota_config(tool, None)
                else:
                    win_h = float(body.get("window_hours") or 5)
                    unit = "cost" if body.get("unit") == "cost" else "tokens"
                    limit_val = body.get("limit")
                    entry: dict = {"window_hours": max(1.0, min(720.0, win_h)), "unit": unit}
                    if limit_val is not None and float(limit_val) > 0:
                        entry["limit"] = float(limit_val)
                    lq = save_local_quota_config(tool, entry)
                self._send_json({"ok": True, "local_quotas": lq})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, status=400)
            return
        if parsed.path == "/api/carrot":
            try:
                length = int(self.headers.get("Content-Length", "0") or "0")
                raw = self.rfile.read(min(length, 65536))
                body = json.loads(raw.decode("utf-8"))
                saved = save_carrot_state(body if isinstance(body, dict) else {})
                self._send_json({"ok": True, **saved})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, status=400)
            return
        self.send_error(HTTPStatus.NOT_FOUND)


class TooTooServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def server_bind(self) -> None:
        # http.server reverse-resolves the bind address before listen(). This
        # JSON/HTML server never uses a canonical hostname; a slow resolver
        # must not block the bundled app's loopback backend from becoming ready.
        socketserver.TCPServer.server_bind(self)
        self.server_name, self.server_port = self.server_address[:2]



def main() -> None:
    ap = argparse.ArgumentParser(description="tootoo — Local Vibe Coding Telemetry Console")
    ap.add_argument("--port", type=int, default=7891, help="HTTP port (default: 7891)")
    ap.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    ap.add_argument("--cli", action="store_true", help="Print terminal summary and exit")
    ap.add_argument("--json", action="store_true", help="Print raw JSON telemetry and exit")
    ap.add_argument("--range", default="week", choices=("today", "yesterday", "week", "last_week", "month", "all", "7d", "30d"), help="Time range")
    ap.add_argument("--tool", default="all", help="Tool filter (all, antigravity, codex, omp, devin, qoder, copilot, droid, grok, opencode, claude, gemini, hermes, qwencode, kimicode, mimocode, cline)")
    ap.add_argument("--refresh-pricing", action="store_true", help="Force refresh remote model pricing catalogs and exit")
    ap.add_argument("--no-open", action="store_true", help="Do not auto-open browser")
    args = ap.parse_args()

    if args.refresh_pricing:
        res = sync_remote_pricing(force=True)
        print(f"Synced {res.get('count', 0)} models from {res.get('sources', [])}")
        return

    if args.json:
        print(json.dumps(build_telemetry(args.range, args.tool), indent=2, ensure_ascii=False))
        return

    if args.cli:
        print_cli_report(args.range, args.tool)
        return

    server = TooTooServer((args.host, args.port), TooTooHandler)
    url = f"http://{args.host}:{args.port}"
    print(f"tootoo running at {url}  (Ctrl+C to stop)")

    # Warm scan cache into memory immediately so first popover open is instant
    def _warmup() -> None:
        try:
            build_telemetry("today", "all")
        except Exception:
            pass
        try:
            fetch_local_weather(force=False)
        except Exception:
            pass

    # Native Off and Quit terminate this owned backend. Give its AGY worker
    # the same cancellation path as a normal shutdown so no child survives.
    agy_auto = os.environ.get("TOOTOO_AGY_CLI") == "auto"
    try:
        if agy_auto:
            def stop_requested(*_):
                raise KeyboardInterrupt
            signal.signal(signal.SIGTERM, stop_requested)
        threading.Thread(target=_warmup, daemon=True).start()

        if not args.no_open:
            threading.Timer(0.35, lambda: webbrowser.open(url)).start()

        server.serve_forever()
    except KeyboardInterrupt:
        print("\ntootoo stopped.")
    finally:
        if agy_auto:
            stop_agy_cli_quota()
        server.server_close()


if __name__ == "__main__":
    main()
