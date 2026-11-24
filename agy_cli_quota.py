"""Opt-in read-only Antigravity CLI quota; no OAuth file reads or RPC probing."""
from __future__ import annotations

import copy
import json
import os
import re
import selectors
import signal
import stat
import subprocess
import tempfile
import threading
import time
from datetime import datetime
from pathlib import Path

_TTL = 60
_MAX_CONFIG = 256 * 1024
_MAX_RESPONSE = 256 * 1024
_NATIVE_MAGIC = {b"\x7fELF", b"\xcf\xfa\xed\xfe", b"\xfe\xed\xfa\xcf",
                 b"\xca\xfe\xba\xbe", b"\xca\xfe\xba\xbf"}
_BUCKETS = {
    "gemini-5h": ("gemini_5h", "gemini", "Gemini Models", "5h", 300),
    "gemini-weekly": ("gemini_7d", "gemini", "Gemini Models", "weekly", 10080),
    "3p-5h": ("cg_5h", "3p", "Claude and GPT models", "5h", 300),
    "3p-weekly": ("cg_7d", "3p", "Claude and GPT models", "weekly", 10080),
    "gemini-argon-wtu-weekly": ("argon_7d", "argon", "Gemini 4 Argon", "weekly", 10080),
}
_LOCK = threading.Lock()
_cache_key = None
_cache_result = None
_cache_until = 0.0


def _result(state, reason=None, quota=None):
    return {"quota": quota, "status": {"state": state, "reason": reason,
             "cache_state": "fresh" if quota is not None else "none"}}


def _json(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("duplicate JSON key")
            result[key] = value
        return result
    return json.loads(raw, object_pairs_hook=unique)


def parse_usage(raw: bytes, now: float):
    """Documented headless success envelope, observed /usage structured groups."""
    try:
        data = _json(raw)
    except (ValueError, RecursionError):
        return None
    if not isinstance(data, dict) or data.get("status") != "SUCCESS":
        return None
    if "error" in data or type(data.get("num_turns")) is not int or data["num_turns"] != 0:
        return None
    usage = data.get("usage")
    if usage is not None and (not isinstance(usage, dict) or any(
            type(usage[k]) is not int or usage[k] != 0
            for k in ("input_tokens", "output_tokens", "thinking_tokens", "cache_read_tokens", "total_tokens")
            if k in usage)):
        return None
    command = data.get("command")
    if not isinstance(command, dict) or command.get("name") != "usage":
        return None
    report = command.get("data")
    if not isinstance(report, dict) or not isinstance(report.get("groups"), list):
        return None
    seen, buckets = set(), []
    for group in report["groups"]:
        if not isinstance(group, dict) or not isinstance(group.get("buckets"), list):
            continue
        for item in group["buckets"]:
            if not isinstance(item, dict):
                continue
            ident = item.get("id")
            known = _BUCKETS.get(ident) if isinstance(ident, str) else None
            if known is None:
                continue
            if ident in seen:
                return None
            seen.add(ident)
            short, group_id, default_label, window, minutes = known
            if item.get("window") != window or item.get("disabled", False) is not False:
                continue
            value = item.get("remaining_fraction")
            if type(value) not in (int, float) or not 0 <= value <= 1:
                continue
            reset = item.get("reset_time")
            if reset is not None:
                try:
                    parsed = datetime.fromisoformat(reset.replace("Z", "+00:00"))
                    if parsed.utcoffset() is None:
                        continue
                    reset = parsed.timestamp()
                    if reset <= now:
                        continue
                except (AttributeError, ValueError, OverflowError, OSError):
                    continue
            name = group.get("name")
            name = name[:80] if isinstance(name, str) and name.strip() else default_label
            label = name + (" · 5h" if window == "5h" else " · Weekly")
            buckets.append({"id": short, "provider_bucket_id": ident, "group_id": group_id,
                            "group_label": name, "label": label, "window_minutes": minutes,
                            "used_percent": round(100 * (1 - value), 8),
                            "remaining_fraction": value, "resets_at": reset})
    return {"source": "cli", "ts": now, "buckets": buckets} if buckets else None


def _find_agy(home):
    # Google's documented installer path, not PATH (which may include a repo,
    # a wrapper, or '.', particularly when launched from an agent terminal).
    try:
        exe = (home / ".local/bin/agy").resolve(strict=True)
        meta = exe.stat()
        if (not stat.S_ISREG(meta.st_mode) or meta.st_uid not in (0, os.getuid()) or
                meta.st_mode & 0o022 or not os.access(exe, os.X_OK)):
            return None
        # Avoid shell scripts/wrappers that can change flags or environment.
        with exe.open("rb") as stream:
            if stream.read(4) not in _NATIVE_MAGIC:
                return None
        return exe
    except (OSError, RuntimeError):
        return None


def _safe_settings(home):
    # CLI documented profile. Run from an empty isolated directory with a minimal
    # env so repository settings and custom homes from the launch shell cannot apply.
    path = home / ".gemini/antigravity-cli/settings.json"
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    except FileNotFoundError:
        return True
    except OSError:
        return False
    try:
        with os.fdopen(fd, "rb") as file:
            meta = os.fstat(file.fileno())
            if not stat.S_ISREG(meta.st_mode) or meta.st_size > _MAX_CONFIG:
                return False
            file_data = file.read(_MAX_CONFIG + 1)
        if len(file_data) > _MAX_CONFIG:
            return False
        settings = _json(file_data)
        return isinstance(settings, dict) and settings.get("disableSlashCommands", False) is False
    except (OSError, ValueError, RecursionError):
        return False


def _exec(exe, args, cwd, env, timeout, cap):
    deadline = time.monotonic() + timeout
    proc = None
    try:
        proc = subprocess.Popen([str(exe), *args], cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, start_new_session=True)
        data = bytearray()
        with selectors.DefaultSelector() as sel:
            sel.register(proc.stdout, selectors.EVENT_READ)
            while (remain := deadline - time.monotonic()) > 0 and sel.select(remain):
                block = os.read(proc.stdout.fileno(), 8192)
                if not block:
                    if proc.wait(timeout=max(0.01, deadline - time.monotonic())) == 0:
                        return bytes(data)
                    return None
                data.extend(block)
                if len(data) > cap:
                    return None
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None
    finally:
        if proc is not None:
            if proc.returncode is None:
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            proc.stdout.close()
            try:
                proc.wait(timeout=.25)
            except subprocess.TimeoutExpired:
                pass
    return None


def _version_ok(raw):
    match = re.fullmatch(rb"(?:agy\s+(?:version\s+)?)?v?(\d{1,4})\.(\d{1,4})\.(\d{1,4})(?:\r?\n)?", raw or b"")
    return bool(match and (1, 1, 11) <= tuple(map(int, match.groups())) < (2, 0, 0))


def fetch_agy_cli_quota(enabled: bool):
    global _cache_key, _cache_result, _cache_until
    with _LOCK:
        if enabled is not True:
            _cache_key, _cache_result, _cache_until = None, None, 0
            return _result("disabled")
        home = Path.home()
        if not _safe_settings(home):
            _cache_key, _cache_result, _cache_until = None, None, 0
            return _result("unavailable", "cli_settings")
        binary = _find_agy(home)
        if binary is None:
            return _result("unavailable", "cli_missing")
        try:
            info = binary.stat()
            key = (home, binary, info.st_dev, info.st_ino, info.st_mtime_ns, info.st_size)
            if key == _cache_key and time.monotonic() < _cache_until:
                result = copy.deepcopy(_cache_result)
                if result["quota"] is not None:
                    result["quota"]["source"], result["status"]["state"] = "cli_cached", "cached"
                return result
            env = {"HOME": str(home), "PATH": "/usr/bin:/bin", "LANG": "en_US.UTF-8"}
            with tempfile.TemporaryDirectory(prefix="tootoo-agy-") as cwd:
                version = _exec(binary, ["--version"], cwd, env, 2.0, 2048)
                if not _version_ok(version):
                    result = _result("unavailable", "cli_version")
                elif not _safe_settings(home):
                    result = _result("unavailable", "cli_settings")
                else:
                    raw = _exec(binary, ["-p", "/usage", "--output-format", "json"], cwd, env, 6.0, _MAX_RESPONSE)
                    quota = parse_usage(raw, time.time()) if raw is not None else None
                    result = (_result("live", quota=quota) if quota else
                              _result("unavailable", "cli_execution" if raw is None else "cli_shape"))
        except OSError:
            return _result("unavailable", "cli_execution")
        _cache_key, _cache_result, _cache_until = key, copy.deepcopy(result), time.monotonic() + _TTL
        if result["quota"] is not None:
            resets = [b["resets_at"] for b in result["quota"]["buckets"] if b["resets_at"] is not None]
            if resets:
                _cache_until = min(_cache_until, time.monotonic() + max(0, min(resets) - time.time()))
        return result
