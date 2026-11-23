"""Read-only, dependency-free lookup of TooToo's latest official stable release."""
from __future__ import annotations

import json
from pathlib import Path
import plistlib
import re
import threading
import time
import urllib.request

API = "https://api.github.com/repos/uuuyuqi/tootoo/releases/latest"
RELEASES = "https://github.com/uuuyuqi/tootoo/releases"
MAX_RESPONSE = 1024 * 1024
CACHE_SECONDS = 6 * 60 * 60
VERSION_RE = re.compile(r"(?:v)?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?\Z")


def semver(value):
    if not isinstance(value, str) or len(value) > 100:
        return None
    match = VERSION_RE.fullmatch(value)
    if not match:
        return None
    major, minor, patch, pre, _build = match.groups()
    ids = pre.split(".") if pre else []
    if any(x.isdecimal() and len(x) > 1 and x[0] == "0" for x in ids):
        return None
    # Numeric prerelease identifiers sort before string identifiers, while
    # an otherwise equal stable version is greater than any prerelease.
    return (int(major), int(minor), int(patch), pre is None,
            tuple((0, int(x)) if x.isdecimal() else (1, x) for x in ids))


def current_version(base=Path(__file__).resolve().parent):
    if base.name == "Resources":
        try:
            with (base.parent / "Info.plist").open("rb") as f:
                version = plistlib.load(f).get("CFBundleShortVersionString")
                if semver(version):
                    return version
        except (OSError, ValueError, plistlib.InvalidFileException):
            pass
    try:
        value = (base / "VERSION").read_text(encoding="utf-8").strip()
        if semver(value):
            return value
    except OSError:
        pass
    return "0.0.0"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # A moved repository is not automatically trusted.


def fetch_release():
    opener = urllib.request.build_opener(NoRedirect())
    req = urllib.request.Request(API, headers={
        "User-Agent": "TooToo-Mac-Update-Check",
        "Accept": "application/vnd.github+json",
    })
    with opener.open(req, timeout=4) as response:
        if response.geturl() != API:
            raise ValueError("unexpected metadata origin")
        data = response.read(MAX_RESPONSE + 1)
    if len(data) > MAX_RESPONSE:
        raise ValueError("response too large")
    return json.loads(data)


def checked_state(current, data):
    if not isinstance(data, dict) or data.get("draft") is not False or data.get("prerelease") is not False:
        raise ValueError("not a public stable release")
    tag = data.get("tag_name")
    release_version = semver(tag)
    current_key = semver(current)
    if not release_version or not release_version[3] or not current_key:
        raise ValueError("invalid version")
    v = ".".join(str(part) for part in release_version[:3])
    if tag != f"v{v}":
        raise ValueError("unexpected release tag format")
    page = f"{RELEASES}/tag/{tag}"
    name = f"TooToo-{tag}-macos-universal.zip"
    archive = f"{RELEASES}/download/{tag}/{name}"
    checksum = archive + ".sha256"
    assets = data.get("assets", [])
    def matching(name, url):
        return sum(1 for a in assets if isinstance(a, dict) and a.get("name") == name
                   and a.get("browser_download_url") == url and a.get("state") == "uploaded") == 1
    install_assets = isinstance(assets, list) and matching(name, archive) and matching(name + ".sha256", checksum)
    notes = data.get("body")
    return {
        "currentVersion": current, "latestVersion": v,
        "status": "available" if release_version > current_key else "current",
        "notes": notes.strip()[:1200] if isinstance(notes, str) else "",
        "releaseURL": page,
        "archiveURL": archive if install_assets else None,
        "checksumURL": checksum if install_assets else None,
        # HTTP clients never acquire installation capability.
        "canInstall": False,
    }


class UpdateChecker:
    def __init__(self, current=None, fetch=fetch_release, now=time.monotonic):
        self.current = current if current is not None else current_version()
        self.fetch = fetch
        self.now = now
        self.lock = threading.Lock()
        self.checked_at = None
        self.state = None
        self.failed = False

    def check(self, force=False):
        with self.lock:
            if force or self.checked_at is None or self.now() - self.checked_at >= CACHE_SECONDS:
                try:
                    self.state = checked_state(self.current, self.fetch())
                    self.failed = False
                except (OSError, ValueError, TypeError):
                    self.failed = True
                self.checked_at = self.now()
            if self.failed:
                if self.state and not force:
                    return dict(self.state)
                return {"currentVersion": self.current, "latestVersion": None,
                        "status": "error" if force else "idle", "canInstall": False,
                        "notes": "", "error": "暂时无法连接 GitHub 检查更新，请稍后重试。" if force else None}
            return dict(self.state)


checker = UpdateChecker()
