import hashlib
import hmac
import json
import os
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server
from update_check import CACHE_SECONDS, RELEASES, UpdateChecker, checked_state, semver


def metadata(version="0.2.5"):
    stem = f"TooToo-v{version}-macos-universal.zip"
    archive = f"{RELEASES}/download/v{version}/{stem}"
    return {"tag_name": f"v{version}", "draft": False, "prerelease": False, "body": "Release notes",
            "assets": [{"name": stem + suffix, "browser_download_url": archive + suffix,
                        "state": "uploaded"} for suffix in ("", ".sha256")]}


class UpdateCheckTests(unittest.TestCase):
    def test_semver_stable_and_prerelease_order(self):
        self.assertLess(semver("v0.2.4"), semver("0.2.10"))
        self.assertLess(semver("1.1.1-beta.2"), semver("1.1.1-beta.11"))
        self.assertLess(semver("1.1.1-beta.11"), semver("1.1.1"))
        self.assertEqual(semver("1.1.1+foo"), semver("1.1.1+bar"))
        self.assertIsNone(semver("1.1.01"))
        self.assertIsNone(semver("1.1.1-alpha.01"))
        self.assertIsNone(semver("v1/2/3"))

    def test_public_metadata_binds_repo_version_exact_names_but_no_install_permission(self):
        data = metadata()
        s = checked_state("0.2.4", data)
        self.assertEqual(s["status"], "available")
        self.assertFalse(s["canInstall"])
        self.assertTrue(s["checksumURL"].endswith(".zip.sha256"))
        self.assertEqual(checked_state("0.2.5", data)["status"], "current")
        data["assets"][0]["browser_download_url"] = "https://github.com/other/tootoo/anything.zip"
        self.assertIsNone(checked_state("0.2.4", data)["archiveURL"])
        data["prerelease"] = True
        with self.assertRaisesRegex(ValueError, "stable"):
            checked_state("0.2.4", data)

    def test_cache_quiet_failure_and_force_retry(self):
        clock = [0]
        calls = []
        def fetch():
            calls.append(clock[0])
            if len(calls) == 1:
                raise OSError("offline")
            return metadata()
        c = UpdateChecker("0.2.4", fetch=fetch, now=lambda: clock[0])
        self.assertEqual(c.check()["status"], "idle")
        self.assertEqual(c.check()["status"], "idle")
        self.assertEqual(len(calls), 1)
        self.assertEqual(c.check(force=True)["status"], "available")
        clock[0] = CACHE_SECONDS - 1
        self.assertEqual(c.check()["status"], "available")
        self.assertEqual(len(calls), 2)
        clock[0] += 1
        self.assertEqual(c.check()["status"], "available")
        self.assertEqual(len(calls), 3)

    def test_local_api_never_installs_and_proves_actual_native_backend(self):
        app = server.TooTooServer(("127.0.0.1", 0), server.TooTooHandler)
        thread = threading.Thread(target=app.serve_forever, daemon=True)
        thread.start()
        url = f"http://127.0.0.1:{app.server_port}/api/update"
        challenge = "959657BB-AE5B-4C13-8062-4616FC1116B7"
        key = "local-backend-private-test-token"
        try:
            with patch.object(server, "update_checker", UpdateChecker("0.2.4", fetch=metadata)):
                with patch.dict(os.environ, {"TOOTOO_UPDATE_NONCE": key}):
                    with urlopen(url, timeout=2) as resp:
                        self.assertFalse(json.load(resp)["canInstall"])
                        self.assertIsNone(resp.headers.get("X-TooToo-Update-Proof"))
                    req = Request(url, headers={"X-TooToo-Update-Challenge": challenge})
                    with urlopen(req, timeout=2) as resp:
                        body = resp.read()
                        expected = hmac.new(key.encode(), challenge.encode() + b"\0" + body, hashlib.sha256).hexdigest()
                        self.assertEqual(resp.headers["X-TooToo-Update-Proof"], expected)
                        self.assertNotIn(key.encode(), body)
                    for request, result in [
                        (Request(url + "?force=1", headers={"Sec-Fetch-Site": "cross-site"}), 403),
                        (Request(url, data=b"install", method="POST"), 404),
                        (Request(url + "/install"), 404),
                    ]:
                        with self.assertRaises(HTTPError) as ex:
                            urlopen(request, timeout=2)
                        self.assertEqual(ex.exception.code, result)
        finally:
            app.shutdown()
            app.server_close()
            thread.join()
