"""Exercise actual native menu actions and WebKit against a disposable loopback service."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import socketserver
import subprocess
import sys
import threading
import time
from urllib.parse import parse_qs, urlsplit

HTML = b"""<!doctype html><meta charset=utf-8><script>
window.__refreshTelemetry = () => fetch('/web-force');
window.__openUpdateSettings = () => fetch('/settings-opened');
</script>"""


class Server(ThreadingHTTPServer):
    def server_bind(self):
        socketserver.TCPServer.server_bind(self)
        self.server_name, self.server_port = self.server_address


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlsplit(self.path)
        with self.server.lock:
            self.server.seen.append(self.path)
        if url.path == "/api/telemetry":
            flags = parse_qs(url.query)
            if flags.get("force") == ["1"]:
                token = self.headers.get("X-TooToo-Quota-Force", "")
                with self.server.lock:
                    self.server.native_force_header = len(token) >= 32
                self.reply(503, b'{"error":"isolated transient fetch failure"}', "application/json")
            else:
                body = json.dumps({
                    "kpi": {"tokens": 590_000_000, "cost": 0},
                    "today_tokens": 590_000_000,
                    "effective_today_tokens": 610_000_000,
                    "quotas": {
                        "antigravity": {"buckets": [
                            {"key": "antigravity:gemini_5h", "used_percent": 25},
                        ]},
                        "grokbot": {"buckets": [
                            {"key": "grokbot:weekly", "used_percent": 1, "resets_at": time.time() - 30},
                            {"key": "grokbot:weekly", "used_percent": 63, "resets_at": time.time() + 300},
                        ]},
                    },
                }).encode()
                self.reply(200, body, "application/json")
        elif url.path == "/":
            time.sleep(0.2)
            self.reply(200, HTML, "text/html;charset=utf-8")
        else:
            self.reply(204, b"", "text/plain")

    def log_message(self, *_):
        pass

    def reply(self, code, body, mime):
        self.send_response(code)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    with Server(("127.0.0.1", 0), Handler) as server:
        server.seen = []
        server.native_force_header = False
        server.lock = threading.Lock()
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            subprocess.run([sys.argv[1], "--menu-summary-ci", str(server.server_port)], check=True, timeout=25)
        finally:
            server.shutdown()
            worker.join(timeout=5)
    assert "/api/telemetry?range=today&tool=all&force=1" in server.seen, server.seen
    assert server.native_force_header, "native force did not carry its process capability"
    assert server.seen.count("/settings-opened") == 1, server.seen
    assert server.seen.count("/web-force") == 1, server.seen


if __name__ == "__main__":
    main()
