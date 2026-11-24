"""Serve only the unmodified release UI files for a disposable WKWebView test."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import sys
from urllib.parse import urlparse


class UIHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            self.path = "/ui/index.html"
        elif not re.fullmatch(r"/ui/tootoo_[a-z_]+\.js", path):
            self.send_error(404)
            return
        super().do_GET()


if __name__ == "__main__":
    from functools import partial

    resources, ready = map(Path, sys.argv[1:])
    serve_ui = partial(UIHandler, directory=resources)
    with ThreadingHTTPServer(("127.0.0.1", 0), serve_ui) as server:
        ready.write_text(str(server.server_port))
        server.serve_forever()
