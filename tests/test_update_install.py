"""Pure stdlib updater safety tests; use update_install_macos.py for native smoke."""
import hashlib
import importlib.util
from pathlib import Path
import plistlib
import stat
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile


SOURCE = Path(__file__).resolve().parents[1] / "macos/update_install.py"
spec = importlib.util.spec_from_file_location("update_install", SOURCE)
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)

APP = updater.APP
EXE = f"{APP}/{updater.EXECUTABLE}"
INFO = f"{APP}/{updater.PLIST}"
RELEASE = f"{APP}/{updater.RESOURCES}/.release"


class InstallerTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve()
        self.archive = self.root / "release.zip"

    def add_archive(self, *, bundle_id=updater.IDENTIFIER, extra=()):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            with zipfile.ZipFile(self.archive, "w") as zf:
                exe = zipfile.ZipInfo(EXE)
                exe.create_system = 3
                exe.external_attr = (stat.S_IFREG | 0o755) << 16
                zf.writestr(exe, b"placeholder")
                zf.writestr(INFO, plistlib.dumps({
                    "CFBundleIdentifier": bundle_id, "CFBundleExecutable": "TooToo",
                    "CFBundlePackageType": "APPL", "CFBundleShortVersionString": "0.2.4",
                }))
                zf.writestr(RELEASE, b"")
                for item, data in extra:
                    zf.writestr(item, data)

    def test_semver_asset_paths_and_no_pre_release(self):
        filename, url, checksum = updater.release_asset_urls("0.2.4")
        self.assertEqual(filename, "TooToo-v0.2.4-macos-universal.zip")
        self.assertEqual(url, "https://github.com/uuuyuqi/tootoo/releases/download/v0.2.4/" + filename)
        self.assertEqual(checksum, url + ".sha256")
        self.assertGreater(updater.version_tuple("0.12.0"), updater.version_tuple("0.9.99"))
        for value in ("0.02.4", "0.2.4-beta", "v0.2.4", "0.2.4/../../file", "0.2.4\n"):
            with self.subTest(value=value), self.assertRaises(updater.UpdateError):
                updater.release_asset_urls(value)

    def test_redirect_requires_exact_https_github_cdn(self):
        path = "/github-production-release-asset/1466351428/123abc-aBc".lower()
        allowed = "https://release-assets.githubusercontent.com" + path
        self.assertTrue(updater.approved_redirect(allowed + "?signed=value"))
        for url in (allowed.replace("https:", "http:"),
                    allowed.replace(".com/", ".com.evil.test/"),
                    allowed.replace("release-assets", "evil@release-assets"),
                    allowed.replace(".com/", ".com:443/"),
                    allowed.replace(path, "/unrelated"),
                    allowed + "#fragment"):
            with self.subTest(url=url):
                self.assertFalse(updater.approved_redirect(url))

    def test_sha256_exact_filename_and_modified_payload(self):
        self.add_archive()
        wanted = hashlib.sha256(self.archive.read_bytes()).hexdigest()
        filename = updater.release_asset_urls("0.2.4")[0]
        expected = updater.parse_checksum(f"{wanted.upper()}  {filename}\n".encode(), filename)
        updater.verify_sha256(self.archive, expected)
        for line in (f"{wanted}  other.zip", f"{wanted}  dist/{filename}",
                     f"{wanted}  {filename}\n{wanted}  {filename}", wanted, "é" * 65):
            with self.subTest(line=line), self.assertRaises(updater.UpdateError):
                updater.parse_checksum(line.encode(), filename)
        self.archive.write_bytes(self.archive.read_bytes() + b"modified")
        with self.assertRaisesRegex(updater.UpdateError, "mismatch"):
            updater.verify_sha256(self.archive, expected)

    def test_safe_zip_and_matching_bundle_identity(self):
        self.add_archive()
        candidate = updater.extract_release(self.archive, self.root)
        self.assertEqual(updater.bundle_version(candidate), "0.2.4")
        with self.assertRaisesRegex(updater.UpdateError, "version"):
            updater.verify_candidate(candidate, "0.2.5")
        with self.assertRaisesRegex(updater.UpdateError, "Universal"):
            updater.verify_candidate(candidate, "0.2.4")

    def test_invalid_debug_bundle_even_with_valid_zip_hash(self):
        self.add_archive(bundle_id=updater.IDENTIFIER + ".debug")
        digest = hashlib.sha256(self.archive.read_bytes()).hexdigest()
        updater.verify_sha256(self.archive, digest)
        candidate = updater.extract_release(self.archive, self.root)
        with self.assertRaisesRegex(updater.UpdateError, "official"):
            updater.bundle_version(candidate)

    def test_reject_unsafe_and_colliding_entries_before_extract(self):
        link = zipfile.ZipInfo(f"{APP}/Contents/Resources/handoff")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        for extra in (f"{APP}/../outside", f"{APP}/Contents\\foo", "/tmp/outside",
                      "Other.app/main", f"{APP}/Contents/info.plist", INFO,
                      f"{APP}/Contents/Foo", link):
            entries = [(extra, "../outside")]
            if extra == f"{APP}/Contents/Foo":
                entries.append((f"{extra}/subfile", b"data"))
            with self.subTest(entry=extra):
                self.add_archive(extra=entries)
                with self.assertRaises(updater.UpdateError):
                    updater.extract_release(self.archive, self.root)
                self.assertFalse((self.root / APP).exists())
                self.assertFalse((self.root / "outside").exists())

    def test_fail_closed_outside_native_macos(self):
        with patch.object(updater.sys, "platform", "linux"):
            with self.assertRaisesRegex(updater.UpdateError, "normal macOS app session"):
                updater.target_info("/Applications/TooToo.app", 234)

    def test_fail_closed_for_source_helper_even_with_packaged_target(self):
        self.add_archive()
        app = updater.extract_release(self.archive, self.root)
        (app / updater.RESOURCES / "update_install.py").write_bytes(b"test")
        with patch.object(updater.sys, "platform", "darwin"), patch.object(updater.os, "getuid", return_value=501), \
                patch.object(updater.os, "geteuid", return_value=501):
            with self.assertRaisesRegex(updater.UpdateError, "source/command-line"):
                updater.target_info(str(app), 234)

    def test_atomic_failure_leaves_previous_bundle_and_records_error(self):
        app = self.root / APP
        app.mkdir()
        stage = self.root / ".TooToo-update-abcdefgh"
        candidate = stage / APP
        candidate.mkdir(parents=True)
        app.joinpath("old").write_text("old")
        candidate.joinpath("new").write_text("new")
        receipt = {
            "original": updater.identity(app), "parent": updater.identity(self.root),
            "stage": updater.identity(stage), "candidate": updater.identity(candidate),
            "version": "0.2.4",
        }

        def exchange(parent, staging, name, *_):
            transient = parent / "swap-testing"
            (parent / name).rename(transient)
            (staging / name).rename(parent / name)
            transient.rename(staging / name)

        with patch.object(updater, "pid_exists", return_value=False), \
                patch.object(updater, "pids_for", return_value=set()), \
                patch.object(updater, "verify_candidate"), \
                patch.object(updater, "atomic_swap", side_effect=exchange) as swap, \
                patch.object(updater, "launch_bundle", side_effect=[False, True]), \
                patch.object(updater, "failure_ledger") as ledger:
            ok, error = updater.finish_install(app, stage, receipt, 9999)
        self.assertFalse(ok)
        self.assertIn("previous version was restored", error)
        self.assertEqual(swap.call_count, 2)
        self.assertTrue(app.joinpath("old").is_file())
        self.assertFalse(stage.exists())
        ledger.assert_called_once_with(app, "0.2.4", error)


if __name__ == "__main__":
    unittest.main()
