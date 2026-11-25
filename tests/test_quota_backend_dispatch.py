import contextlib
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
from unittest.mock import Mock, patch

import quota_runtime
import scanner
import server


class QuotaBackendDispatchTests(unittest.TestCase):
    @contextlib.contextmanager
    def running_backend(self, handler=server.TooTooHandler):
        with server.TooTooServer(("127.0.0.1", 0), handler) as httpd:
            thread = threading.Thread(target=httpd.serve_forever, kwargs={"poll_interval": .03}, daemon=True)
            thread.start()
            try:
                yield httpd
            finally:
                httpd.shutdown()
                thread.join(timeout=1)

    def test_get_force_schedules_codex_only_from_exact_native_token(self):
        with self.running_backend() as httpd, patch.dict(os.environ, {"TOOTOO_QUOTA_FORCE_TOKEN": "fixture"}), \
                patch.object(server, "build_telemetry", return_value={}) as build:
            httpd.schedule_codex_force = Mock()
            for headers, expected_status in (({}, 200), ({"X-TooToo-Quota-Force": "wrong"}, 200),
                    ({"X-TooToo-Quota-Force": "fixture", "Sec-Fetch-Site": "cross-site"}, 403),
                    ({"X-TooToo-Quota-Force": "fixture", "Host": "example.invalid"}, 200)):
                client = http.client.HTTPConnection("127.0.0.1", httpd.server_port, timeout=1)
                try:
                    client.request("GET", "/api/telemetry?force=1", headers=headers)
                    with client.getresponse() as response:
                        self.assertEqual(response.status, expected_status)
                        response.read()
                finally:
                    client.close()
                httpd.schedule_codex_force.assert_not_called()
            client = http.client.HTTPConnection("127.0.0.1", httpd.server_port, timeout=1)
            try:
                client.request("GET", "/api/telemetry?force=1",
                               headers={"X-TooToo-Quota-Force": "fixture"})
                with client.getresponse() as response:
                    self.assertEqual(response.status, 200)
                    self.assertNotIn("fixture", response.read().decode())
            finally:
                client.close()
            httpd.schedule_codex_force.assert_called_once()
            self.assertTrue(build.call_args.kwargs["force"])

    def test_published_between_get_and_reconnect_is_sent_immediately(self):
        with self.running_backend() as httpd, patch.object(server, "build_telemetry", return_value={"latest": True}):
            source = http.client.HTTPConnection("127.0.0.1", httpd.server_port, timeout=1)
            try:
                source.request("GET", "/api/telemetry")
                with source.getresponse() as response:
                    seen = json.load(response)["quota_version"]
            finally:
                source.close()
            quota_runtime.publish()
            subscriber = http.client.HTTPConnection("127.0.0.1", httpd.server_port, timeout=1)
            try:
                subscriber.request("GET", f"/api/stream?skip_initial=1&since_quota_version={seen}")
                with subscriber.getresponse() as response:
                    first = response.fp.readline()
                    self.assertTrue(first.startswith(b"data: "), first)
                    self.assertGreater(json.loads(first[6:])["quota_version"], seen)
            finally:
                subscriber.close()

    def test_waiting_stream_exits_on_disconnect_and_server_shutdown(self):
        left, waiting = threading.Event(), threading.Event()

        class Handler(server.TooTooHandler):
            def finish(self):
                try:
                    super().finish()
                finally:
                    left.set()

        def wait(*args, **kwargs):
            waiting.set()
            return quota_runtime.wait(*args, **kwargs)

        for stop in ("disconnect", "shutdown"):
            left.clear()
            waiting.clear()
            with self.running_backend(Handler) as httpd, \
                    patch.object(server, "wait_for_quota_update", side_effect=wait), \
                    patch.object(server, "build_telemetry", side_effect=AssertionError("unexpected render")):
                subscriber = http.client.HTTPConnection("127.0.0.1", httpd.server_port, timeout=1)
                try:
                    subscriber.request("GET", f"/api/stream?skip_initial=1&since_quota_version={quota_runtime.generation()}")
                    with subscriber.getresponse():
                        self.assertTrue(waiting.wait(1))
                        if stop == "shutdown":
                            httpd.shutdown()
                            self.assertTrue(left.wait(1.2))
                    subscriber.close()
                    self.assertTrue(left.wait(1.2))
                finally:
                    subscriber.close()

    def test_scanner_passes_force_to_eligible_agy_only(self):
        events = [{"tool": "antigravity", "ts": time.time()}]
        response = {"quota": None, "status": {"state": "loading"}}
        with patch.dict(os.environ, {"TOOTOO_AGY_CLI": "auto"}), \
                patch.object(scanner, "fetch_agy_cli_quota", return_value=response) as fetch:
            scanner.select_antigravity_quota(events, force=True)
            fetch.assert_called_once_with(enabled=True, force=True)
        with patch.dict(os.environ, {"TOOTOO_AGY_CLI": "off"}), \
                patch.object(scanner, "fetch_agy_cli_quota") as fetch:
            result, _ = scanner.select_antigravity_quota(events, force=True)
            self.assertEqual(result["status"]["state"], "disabled")
            fetch.assert_not_called()

    def test_data_dir_alias_and_legacy_home_keep_all_storage_in_one_root(self):
        with tempfile.TemporaryDirectory() as work:
            home = str(Path(work) / "home")
            alias = str(Path(work) / "alias")
            legacy = str(Path(work) / "legacy")
            for setting, want in (({"TOOTOO_DATA_DIR": alias}, alias),
                                  ({"TOOTOO_DATA_DIR": alias, "TOOTOO_HOME": legacy}, legacy)):
                env = {"PATH": os.environ.get("PATH", ""), "HOME": home,
                       "PYTHONDONTWRITEBYTECODE": "1", **setting}
                script = ("import agy_cli_quota, os, pricing, scanner, server;"
                          "assert scanner.CACHE_DIR == pricing.TOOTOO_DIR == os.environ['EXPECT'];"
                          "assert str(agy_cli_quota._cache_path().parent) == scanner.CACHE_DIR;"
                          "assert os.path.dirname(server.WEATHER_CACHE_FILE) == scanner.CACHE_DIR")
                subprocess.run([sys.executable, "-c", script],
                               cwd=Path(__file__).resolve().parents[1], timeout=5, check=True,
                               env={**env, "EXPECT": want})
