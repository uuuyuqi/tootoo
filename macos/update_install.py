"""Private native TooToo release updater. No HTTP listener or standalone mode."""
import argparse
import ctypes
from functools import lru_cache
import hashlib
import hmac
import json
import os
from pathlib import Path
import plistlib
import pwd
import re
import shutil
import stat
import struct
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from xml.parsers.expat import ExpatError
import zipfile


APP = "TooToo.app"
IDENTIFIER = "com.tootoo.telemetry"
EXECUTABLE = Path("Contents/MacOS/TooToo")
RESOURCES = Path("Contents/Resources")
PLIST = Path("Contents/Info.plist")
STAGE_PREFIX = ".TooToo-update-"
ROOT_ENDPOINT = "https://github.com/uuuyuqi/tootoo/releases/download"
CDN_HOST = "release-assets.githubusercontent.com"
MAX_ARCHIVE = 96 * 1024**2
MAX_EXPANDED = 256 * 1024**2
MAX_ENTRIES = 2000
BLOCK = 64 * 1024
VERSION = re.compile(r"(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\Z")
STAGE_NAME = re.compile(re.escape(STAGE_PREFIX) + r"[a-z0-9_]{8}\Z")


class UpdateError(RuntimeError):
    pass


def version_tuple(version):
    match = VERSION.fullmatch(version) if isinstance(version, str) else None
    if not match:
        raise UpdateError("Not a stable release version.")
    return tuple(map(int, match.groups()))


def release_asset_urls(version):
    version_tuple(version)
    filename = f"TooToo-v{version}-macos-universal.zip"
    zip_url = f"{ROOT_ENDPOINT}/v{version}/{filename}"
    return filename, zip_url, zip_url + ".sha256"


def approved_redirect(url):
    parts = urllib.parse.urlsplit(url)
    return (
        parts.scheme == "https" and parts.netloc == CDN_HOST and not parts.fragment
        and re.fullmatch(r"/github-production-release-asset/[0-9]+/[a-z0-9-]+", parts.path)
        is not None
    )


class ReleaseRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 3

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not approved_redirect(newurl):
            raise UpdateError("The release asset redirected outside GitHub's download service.")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def download_file(url, destination, limit, progress=lambda _: None):
    opener = urllib.request.build_opener(ReleaseRedirect())
    request = urllib.request.Request(url, headers={"User-Agent": "TooToo-App-Updater/1"})
    try:
        with opener.open(request, timeout=12) as response, destination.open("xb") as out:
            final = response.geturl()
            if final != url and not approved_redirect(final):
                raise UpdateError("Unexpected release download location.")
            declared = response.headers.get("Content-Length")
            total = int(declared) if declared is not None and declared.isdecimal() else 0
            if total > limit:
                raise UpdateError("The release asset is larger than allowed.")
            size = 0
            deadline = time.monotonic() + 240
            while data := response.read1(BLOCK):
                size += len(data)
                if size > limit or time.monotonic() > deadline:
                    raise UpdateError("The release download exceeded its size or time limit.")
                out.write(data)
                progress(min(1.0, size / total) if total else 0.0)
            if size == 0 or (total and size != total):
                raise UpdateError("The release download is incomplete.")
    except urllib.error.HTTPError as exc:
        raise UpdateError(f"GitHub release download failed (HTTP {exc.code}).") from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise UpdateError("Could not download the release asset.") from None


def parse_checksum(data, filename):
    try:
        line = data.decode("ascii").rstrip("\r\n")
    except UnicodeError:
        raise UpdateError("Invalid release SHA-256 file.") from None
    match = re.fullmatch(r"([0-9a-fA-F]{64}) [ *]" + re.escape(filename), line)
    if not match:
        raise UpdateError("The SHA-256 file does not match this release asset.")
    return match[1].lower()


def verify_sha256(archive, expected):
    if not isinstance(expected, str) or re.fullmatch(r"[a-f0-9]{64}", expected) is None:
        raise UpdateError("Invalid release SHA-256.")
    digest = hashlib.sha256()
    with archive.open("rb") as src:
        while data := src.read(BLOCK):
            digest.update(data)
    if not hmac.compare_digest(digest.hexdigest(), expected):
        raise UpdateError("Release SHA-256 mismatch; nothing was installed.")


def zip_entries(archive):
    entries = archive.infolist()
    if not entries or len(entries) > MAX_ENTRIES:
        raise UpdateError("Unexpected number of files in the release archive.")
    indexed = {}
    present = {}
    total = 0
    for info in entries:
        name = info.filename
        parts = tuple(name.rstrip("/").split("/"))
        if (
            name != info.orig_filename or not parts or parts[0] != APP or len(parts) > 32
            or name.endswith("//") or len(name.encode("utf-8")) > 1024
            or any(p in ("", ".", "..") or p.endswith((" ", ".")) for p in parts)
            or any(c in name for c in "\\:") or any(ord(c) < 32 or ord(c) == 127 for c in name)
        ):
            raise UpdateError("Unsafe release archive path.")
        directory = info.is_dir()
        mode = info.external_attr >> 16
        if (
            stat.S_IFMT(mode) not in (0, stat.S_IFDIR if directory else stat.S_IFREG)
            or bool(info.external_attr & 0x10) and not directory
            or (directory and info.file_size != 0)
            or info.flag_bits & 1
            or info.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
        ):
            raise UpdateError("Unsupported release archive entry (including links or special files).")
        total += info.file_size
        if total > MAX_EXPANDED or info.file_size > MAX_ARCHIVE:
            raise UpdateError("The expanded release archive is larger than allowed.")
        for index in range(1, len(parts) + 1):
            prefix = parts[:index]
            normalized = tuple(unicodedata.normalize("NFC", p).casefold() for p in prefix)
            kind = index < len(parts) or directory
            if indexed.setdefault(normalized, (prefix, kind)) != (prefix, kind):
                raise UpdateError("Conflicting paths in the release archive.")
        if parts in present:
            raise UpdateError("Duplicate path in the release archive.")
        present[parts] = directory
        yield info, parts, directory, mode
    if (
        present.get((APP, *PLIST.parts), True) or present.get((APP, *EXECUTABLE.parts), True)
        or present.get((APP, *RESOURCES.parts, ".release"), True)
    ):
        raise UpdateError("The ZIP does not contain an official TooToo bundle.")


def extract_release(archive, staging):
    try:
        with zipfile.ZipFile(archive) as zf:
            entries = list(zip_entries(zf))  # Validate every path before materializing any.
            for info, parts, directory, mode in entries:
                dst = staging.joinpath(*parts)
                if directory:
                    dst.mkdir(parents=True, exist_ok=True, mode=0o755)
                    continue
                dst.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
                size = 0
                with zf.open(info) as src, dst.open("xb") as out:
                    while data := src.read(BLOCK):
                        size += len(data)
                        if size > info.file_size:
                            raise UpdateError("Unexpected size while unpacking the release.")
                        out.write(data)
                if size != info.file_size:
                    raise UpdateError("The release archive contains an incomplete file.")
                dst.chmod(0o755 if mode & 0o111 else 0o644)
    except (zipfile.BadZipFile, RuntimeError, UnicodeError) as exc:
        if isinstance(exc, UpdateError):
            raise
        raise UpdateError("Invalid or corrupted release archive.") from None
    return staging / APP


def canonical_path(raw):
    path = Path(raw)
    if not path.is_absolute() or str(path) != raw or path.resolve(strict=True) != path:
        raise UpdateError("The running TooToo bundle is not at a stable local path.")
    return path


def regular_path(path):
    if not stat.S_ISREG(path.lstat().st_mode) or path.resolve(strict=True) != path:
        raise UpdateError("Missing or invalid required file in TooToo.app.")
    return path


def bundle_version(bundle):
    if bundle.name != APP or bundle.resolve(strict=True) != bundle or not bundle.is_dir():
        raise UpdateError("Only a packaged TooToo.app can use in-app installation.")
    plist_file = regular_path(bundle / PLIST)
    if plist_file.stat().st_size > 64 * 1024:
        raise UpdateError("Invalid TooToo bundle metadata.")
    try:
        info = plistlib.loads(plist_file.read_bytes())
    except (ValueError, TypeError, ExpatError):
        raise UpdateError("Invalid TooToo bundle metadata.") from None
    if (
        not isinstance(info, dict) or info.get("CFBundleIdentifier") != IDENTIFIER
        or info.get("CFBundleExecutable") != "TooToo"
        or info.get("CFBundlePackageType") != "APPL"
    ):
        raise UpdateError("The bundle is not the official TooToo release.")
    regular_path(bundle / RESOURCES / ".release")
    executable = regular_path(bundle / EXECUTABLE)
    if executable.stat().st_mode & 0o111 == 0:
        raise UpdateError("The TooToo executable is not executable.")
    return info.get("CFBundleShortVersionString")


def assert_universal(binary):
    with binary.open("rb") as fd:
        header = fd.read(8)
        if len(header) != 8:
            raise UpdateError("Invalid TooToo executable.")
        magic, count = struct.unpack(">II", header)
        if magic not in (0xCAFEBABE, 0xCAFEBABF) or not 2 <= count <= 16:
            raise UpdateError("This update is not a Universal macOS application.")
        record_size = 32 if magic == 0xCAFEBABF else 20
        table = fd.read(count * record_size)
    if len(table) != count * record_size:
        raise UpdateError("Incomplete TooToo executable.")
    arches = {struct.unpack_from(">I", table, offset)[0]
              for offset in range(0, len(table), record_size)}
    if not {0x01000007, 0x0100000C}.issubset(arches):
        raise UpdateError("The update must include Intel and Apple silicon.")


def verify_candidate(bundle, version):
    if bundle_version(bundle) != version:
        raise UpdateError("The downloaded bundle version does not match the release.")
    assert_universal(bundle / EXECUTABLE)
    # This checks the code/resource seals. Publisher provenance comes from the
    # exact official GitHub ZIP and digest (the current app is ad-hoc signed).
    try:
        command = ["/usr/bin/codesign", "--verify", "--deep", "--strict", "--all-architectures",
                   "-R", f'=identifier "{IDENTIFIER}"', str(bundle)]
        result = subprocess.run(command, capture_output=True, timeout=25, check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise UpdateError("Code signature verification could not run.") from None
    if result.returncode:
        raise UpdateError("The downloaded app's code signature failed verification.")


@lru_cache(maxsize=1)
def proc_lib():
    if sys.platform != "darwin":
        raise UpdateError("In-app installation is only available on macOS.")
    proc = ctypes.CDLL("/usr/lib/libproc.dylib", use_errno=True)
    proc.proc_pidpath.argtypes = (ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32)
    proc.proc_pidpath.restype = ctypes.c_int
    proc.proc_listallpids.argtypes = (ctypes.c_void_p, ctypes.c_int)
    proc.proc_listallpids.restype = ctypes.c_int
    return proc


def proc_path(pid):
    buf = ctypes.create_string_buffer(4096)
    if proc_lib().proc_pidpath(pid, buf, len(buf)) <= 0:
        return None
    return os.fsdecode(buf.value)


def pids_for(executable):
    proc = proc_lib()
    size = proc.proc_listallpids(None, 0)
    if size <= 0:
        raise UpdateError("Could not confirm the running TooToo instance.")
    slots = (ctypes.c_int * (size + 128))()
    size = proc.proc_listallpids(slots, ctypes.sizeof(slots))
    if not 0 < size < len(slots):
        raise UpdateError("Could not confirm the running TooToo instance.")
    expected = str(executable)
    return {pid for pid in slots[:size] if pid > 0 and proc_path(pid) == expected}


def pid_exists(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def target_info(raw_bundle, pid):
    if sys.platform != "darwin" or os.geteuid() == 0 or os.getuid() != os.geteuid():
        raise UpdateError("Only a normal macOS app session can install an update.")
    bundle = canonical_path(raw_bundle)
    version = bundle_version(bundle)
    version_tuple(version)
    if "AppTranslocation" in bundle.parts or not os.access(bundle.parent, os.W_OK | os.X_OK):
        raise UpdateError("This TooToo installation cannot be replaced without administrator access.")
    packaged_helper = regular_path(bundle / RESOURCES / "update_install.py")
    if Path(__file__).resolve(strict=True) != packaged_helper:
        raise UpdateError("The source/command-line updater cannot replace apps.")
    if pid <= 1 or os.getppid() != pid or proc_path(pid) != str(bundle / EXECUTABLE):
        raise UpdateError("The installer was not started by the running TooToo app.")
    return bundle, version


def identity(path):
    meta = path.lstat()
    if not stat.S_ISDIR(meta.st_mode):
        raise UpdateError("Unexpected change to the app or staging directory.")
    return [meta.st_dev, meta.st_ino, meta.st_uid]


def secure_stage(raw_staging, bundle):
    stage = canonical_path(raw_staging)
    st = stage.lstat()
    if (
        stage.parent != bundle.parent or not STAGE_NAME.fullmatch(stage.name)
        or not stat.S_ISDIR(st.st_mode) or st.st_uid != os.getuid()
        or stat.S_IMODE(st.st_mode) != 0o700 or st.st_dev != bundle.parent.stat().st_dev
    ):
        raise UpdateError("The update staging directory is invalid.")
    return stage


def write_json(path, payload):
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w",
                   encoding="utf-8") as out:
        json.dump(payload, out)
        out.write("\n")


def read_receipt(staging, bundle, current, pid):
    file = regular_path(staging / "receipt.json")
    st = file.lstat()
    if st.st_uid != os.getuid() or st.st_size > 4096 or stat.S_IMODE(st.st_mode) != 0o600:
        raise UpdateError("The update staging receipt is invalid.")
    try:
        receipt = json.loads(file.read_bytes())
    except (ValueError, TypeError):
        raise UpdateError("Invalid update staging receipt.") from None
    if not isinstance(receipt, dict) or (
        receipt.get("bundle"), receipt.get("pid"), receipt.get("current"),
        receipt.get("original"), receipt.get("parent"), receipt.get("stage")
    ) != (str(bundle), pid, current, identity(bundle), identity(bundle.parent), identity(staging)):
        raise UpdateError("The running app or staging directory changed before installation.")
    if version_tuple(receipt.get("version")) <= version_tuple(current):
        raise UpdateError("The update is not newer than the running app.")
    return receipt


def send(status, **data):
    print(json.dumps(dict(status=status, **data)), flush=True)


def stage_update(args, bundle, current):
    if version_tuple(args.version) <= version_tuple(current):
        raise UpdateError("The update is not newer than the running app.")
    filename, zip_url, checksum_url = release_asset_urls(args.version)
    if (args.zip_url, args.checksum_url) != (zip_url, checksum_url):
        raise UpdateError("The update is not from the official TooToo releases.")
    original = identity(bundle)
    parent = identity(bundle.parent)
    if original[0] != parent[0]:
        raise UpdateError("The app and staging must be on the same local volume.")
    stage = Path(tempfile.mkdtemp(prefix=STAGE_PREFIX, dir=bundle.parent))
    finalized = False
    try:
        checksum, archive = stage / "sha256.txt", stage / "release.zip"
        send("downloading", progress=0)
        def ensure_parent():
            if os.getppid() != args.parent or proc_path(args.parent) != str(bundle / EXECUTABLE):
                raise UpdateError("TooToo closed before the update was staged.")

        download_file(checksum_url, checksum, 1024)
        ensure_parent()
        expected = parse_checksum(checksum.read_bytes(), filename)
        last = -1
        checked = 0.

        def progress(ratio):
            nonlocal last, checked
            if time.monotonic() - checked > 0.5:
                ensure_parent()
                checked = time.monotonic()
            percent = int(ratio * 100)
            if percent >= last + 2 or percent == 100:
                last = percent
                send("downloading", progress=ratio)

        download_file(zip_url, archive, MAX_ARCHIVE, progress)
        send("verifying")
        verify_sha256(archive, expected)
        candidate = extract_release(archive, stage)
        verify_candidate(candidate, args.version)
        ensure_parent()
        # The zip reader does not import macOS extended attributes from the archive.
        # Never strip existing app attributes or alter system Gatekeeper settings.
        if identity(bundle) != original or identity(bundle.parent) != parent:
            raise UpdateError("The installed app changed while the update downloaded.")
        write_json(stage / "receipt.json", {
            "bundle": str(bundle), "pid": args.parent, "current": current, "original": original,
            "parent": parent, "stage": identity(stage), "candidate": identity(candidate),
            "version": args.version, "sha256": expected,
        })
        send("staged", stagingPath=str(stage))
        finalized = True
    finally:
        if not finalized:
            shutil.rmtree(stage, ignore_errors=True)


def atomic_swap(parent, stage, bundle_name, expected_parent, expected_stage,
                expected_installed, expected_candidate):
    """Exchange two app directory entries atomically, never a two-rename fallback."""
    lib = ctypes.CDLL(None, use_errno=True)
    rename_swap = lib.renameatx_np
    rename_swap.argtypes = (ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint)
    rename_swap.restype = ctypes.c_int
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
    parent_fd = os.open(parent, flags)
    try:
        stage_fd = os.open(stage.name, flags, dir_fd=parent_fd)
        try:
            def fd_identity(fd):
                meta = os.fstat(fd)
                return [meta.st_dev, meta.st_ino, meta.st_uid]

            if fd_identity(parent_fd) != expected_parent or fd_identity(stage_fd) != expected_stage:
                raise UpdateError("The update directories changed before replacement.")
            def entry_identity(name, fd):
                meta = os.stat(name, dir_fd=fd, follow_symlinks=False)
                if not stat.S_ISDIR(meta.st_mode):
                    raise UpdateError("An app was replaced with an unexpected entry.")
                return [meta.st_dev, meta.st_ino, meta.st_uid]

            if (entry_identity(bundle_name, parent_fd) != expected_installed
                    or entry_identity(APP, stage_fd) != expected_candidate):
                raise UpdateError("The app changed immediately before replacement.")
            if rename_swap(parent_fd, os.fsencode(bundle_name), stage_fd, os.fsencode(APP),
                           0x00000002 | 0x00000010) != 0:  # RENAME_SWAP | RENAME_NOFOLLOW_ANY
                raise UpdateError("The app could not be replaced atomically on this volume.")
        finally:
            os.close(stage_fd)
    finally:
        os.close(parent_fd)


def launch_bundle(bundle):
    try:
        result = subprocess.run(["/usr/bin/open", "-n", "-a", str(bundle)],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                timeout=10, check=False)
    except (OSError, subprocess.TimeoutExpired):
        # Still poll: LaunchServices might have started the process despite the error.
        result = None
    deadline = time.monotonic() + (8 if result and not result.returncode else 2)
    seen = {}
    while time.monotonic() < deadline:
        now = time.monotonic()
        running = pids_for(bundle / EXECUTABLE)
        seen = {p: seen.get(p, now) for p in running}
        if seen and now - min(seen.values()) >= 1.5:
            return True
        time.sleep(0.1)
    return False


def failure_ledger(bundle, version, error):
    try:
        home = Path(pwd.getpwuid(os.getuid()).pw_dir)
        cache = home / "Library/Caches" / IDENTIFIER
        cache.mkdir(parents=True, exist_ok=True, mode=0o700)
        if cache.resolve(strict=True) != cache or cache.lstat().st_uid != os.getuid():
            return
        with tempfile.TemporaryDirectory(prefix=".update-result-", dir=cache) as tmp:
            path = Path(tmp) / "receipt"
            write_json(path, {"version": version, "error": error, "bundlePath": str(bundle)})
            path.replace(cache / "update-result.json")
    except OSError:
        pass


def finish_install(bundle, staging, receipt, pid):
    """Run after native quit. Return (success, error message); preserve backup on ambiguity."""
    candidate = staging / APP
    executable = bundle / EXECUTABLE
    swapped = False
    safe_to_clean = False
    original_restored = False
    try:
        deadline = time.monotonic() + 25
        while pid_exists(pid):
            if time.monotonic() >= deadline:
                raise UpdateError("TooToo did not exit in time; the installed app was not changed.")
            time.sleep(0.1)
        if (
            identity(bundle) != receipt["original"] or identity(staging) != receipt["stage"]
            or identity(candidate) != receipt["candidate"] or pids_for(executable)
        ):
            raise UpdateError("TooToo changed or was relaunched before the update.")
        verify_candidate(candidate, receipt["version"])
        atomic_swap(bundle.parent, staging, bundle.name, receipt["parent"], receipt["stage"],
                    receipt["original"], receipt["candidate"])
        swapped = True
        if identity(bundle) != receipt["candidate"] or identity(candidate) != receipt["original"]:
            raise UpdateError("Could not confirm the atomic replacement; no app was started.")
        try:
            launched = launch_bundle(bundle)
        except (UpdateError, OSError):
            launched = False
        if launched:
            safe_to_clean = True
            return True, None
        if pids_for(executable):
            raise UpdateError("Could not verify the update restart. The previous app was kept as a backup.")
        if identity(bundle) != receipt["candidate"] or identity(candidate) != receipt["original"]:
            raise UpdateError("The app unexpectedly changed after replacement; the backup was kept.")
        atomic_swap(bundle.parent, staging, bundle.name, receipt["parent"], receipt["stage"],
                    receipt["candidate"], receipt["original"])
        if identity(bundle) != receipt["original"] or identity(candidate) != receipt["candidate"]:
            raise UpdateError("Could not confirm rollback; the previous app was not discarded.")
        swapped = False
        original_restored = True
        raise UpdateError("The new app could not start; the previous version was restored.")
    except (UpdateError, OSError) as exc:
        error = str(exc) if isinstance(exc, UpdateError) else "Could not complete the app replacement."
        if swapped:
            error += " Previous app backup: " + str(staging / APP)
        parent_exited = not pid_exists(pid)
        if parent_exited:
            failure_ledger(bundle, receipt["version"], error)
        if not swapped and parent_exited:
            try:
                if (original_restored or identity(bundle) == receipt["original"]) and not pids_for(executable):
                    launch_bundle(bundle)
            except (UpdateError, OSError):
                pass
        return False, error
    finally:
        if safe_to_clean or not swapped:
            try:
                if identity(staging) == receipt["stage"]:
                    shutil.rmtree(staging, ignore_errors=True)
            except (UpdateError, OSError):
                pass


def start_install(args, bundle, current):
    stage = secure_stage(args.staged, bundle)
    receipt = read_receipt(stage, bundle, current, args.parent)
    candidate = stage / APP
    if identity(candidate) != receipt.get("candidate"):
        raise UpdateError("The staged app changed before installation.")
    archive = regular_path(stage / "release.zip")
    if archive.stat().st_size > MAX_ARCHIVE:
        raise UpdateError("The staged release archive is too large.")
    verify_sha256(archive, receipt.get("sha256"))
    verify_candidate(candidate, receipt["version"])
    if pids_for(bundle / EXECUTABLE) != {args.parent}:
        raise UpdateError("Close other running copies of TooToo before updating.")
    # Foundation may create the helper in its own process group. Fork once so
    # setsid is safe even if the Process child was already the group leader.
    if os.fork() != 0:
        return 0
    os.setsid()
    send("ready")
    # Do no further writes to the parent's progress pipe after readiness.
    with open(os.devnull, "rb+") as devnull:
        for fd in (0, 1, 2):
            os.dup2(devnull.fileno(), fd)
    succeeded, _ = finish_install(bundle, stage, receipt, args.parent)
    return 0 if succeeded else 1


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="operation", required=True)
    for op in ("stage", "install", "discard"):
        action = sub.add_parser(op)
        action.add_argument("--bundle", required=True)
        action.add_argument("--parent", required=True, type=int)
        if op == "stage":
            action.add_argument("--version", required=True)
            action.add_argument("--zip-url", required=True)
            action.add_argument("--checksum-url", required=True)
        else:
            action.add_argument("--staged", required=True)
    args = parser.parse_args()
    try:
        bundle, current = target_info(args.bundle, args.parent)
        if args.operation == "stage":
            stage_update(args, bundle, current)
        elif args.operation == "install":
            return start_install(args, bundle, current)
        elif args.operation == "discard":
            stage = secure_stage(args.staged, bundle)
            read_receipt(stage, bundle, current, args.parent)
            shutil.rmtree(stage)
        return 0
    except (UpdateError, OSError, ValueError, ctypes.ArgumentError) as exc:
        send("error", error=str(exc) if isinstance(exc, UpdateError) else "Could not prepare a safe app update.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
