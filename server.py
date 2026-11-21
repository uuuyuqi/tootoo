#!/usr/bin/env python3
"""
tootoo Server & CLI — Local HTTP server + SSE live stream + Terminal telemetry summary.
Zero external dependencies (Python 3 stdlib only).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from pricing import sync_remote_pricing
from scanner import build_telemetry, save_local_quota_config

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UI_FILE = os.path.join(BASE_DIR, "ui", "index.html")
BUNNY_LINES_FILE = os.path.join(BASE_DIR, "ui", "bunny_lines.json")


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

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/index.html"):
            try:
                with open(UI_FILE, "rb") as f:
                    html = f.read()
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(html)))
                self.end_headers()
                self.wfile.write(html)
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
        self.send_error(HTTPStatus.NOT_FOUND)


class TooTooServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main() -> None:
    ap = argparse.ArgumentParser(description="tootoo — Local Vibe Coding Telemetry Console")
    ap.add_argument("--port", type=int, default=7891, help="HTTP port (default: 7891)")
    ap.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    ap.add_argument("--cli", action="store_true", help="Print terminal summary and exit")
    ap.add_argument("--json", action="store_true", help="Print raw JSON telemetry and exit")
    ap.add_argument("--range", default="7d", choices=("today", "7d", "30d", "all"), help="Time range")
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

    threading.Thread(target=_warmup, daemon=True).start()

    if not args.no_open:
        threading.Timer(0.35, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\ntootoo stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
