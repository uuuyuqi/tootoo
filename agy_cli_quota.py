"""Opt-in read-only Antigravity CLI quota; no OAuth file reads or RPC probing."""
from __future__ import annotations

import hashlib
import json
import os
import pwd
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

_TTL = 180
_FAILURE_TTL = 30
_MAX_AGE = 24 * 60 * 60
_CACHE_NAME = "agy_cli_quota_cache.json"
_MAX_CONFIG = 256 * 1024
_MAX_RESPONSE = 512 * 1024
_USAGE_TIMEOUT = 20.0
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
_UPDATED = threading.Condition(_LOCK)
_generation = 0
_cache_key = None
_cache_result = None
_cache_until = 0.0
_cache_reason = None
_pending = None


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
                    if reset == 0 and value == 1:
                        # AGY reports the protobuf zero timestamp when a full
                        # window has not started; there is no reset to show.
                        reset = None
                    elif reset <= now:
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


def _explicit_auth_failure(raw):
    # Only explicit absence/re-auth signals invalidate the account's previous
    # sample. Normal network errors and a temporarily locked keychain do not.
    return re.search(rb"\b(?:authentication required|not authenticated|not signed in|not logged in|reauthentication required)\b",
                     raw.lower()) is not None


def _exec(exe, args, cwd, env, timeout, cap, cancelled=None):
    deadline = time.monotonic() + timeout
    proc = None
    try:
        if cancelled is not None and cancelled.is_set():
            return None, "cli_cancelled"
        usage = args[:2] == ["-p", "/usage"]
        proc = subprocess.Popen([str(exe), *args], cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE if usage else subprocess.DEVNULL,
                                start_new_session=True)
        data = bytearray()
        diagnostics = bytearray()
        eof = False
        with selectors.DefaultSelector() as sel:
            sel.register(proc.stdout, selectors.EVENT_READ)
            if proc.stderr is not None:
                sel.register(proc.stderr, selectors.EVENT_READ)
            while (remain := deadline - time.monotonic()) > 0:
                if cancelled is not None and cancelled.is_set():
                    return None, "cli_cancelled"
                if eof and not sel.get_map():
                    if (status := proc.poll()) is not None:
                        if status == 0:
                            return bytes(data), None
                        return None, "cli_auth" if _explicit_auth_failure(diagnostics) else "cli_exit"
                    time.sleep(min(.05, remain))
                    continue
                for ready, _ in sel.select(min(.1, remain)):
                    block = os.read(ready.fd, 8192)
                    if not block:
                        if ready.fileobj is proc.stdout:
                            eof = True
                        sel.unregister(ready.fileobj)
                        continue
                    if ready.fileobj is proc.stderr:
                        # Bounded, in-memory only. Never report/write stderr.
                        diagnostics.extend(block[:max(0, 16384 - len(diagnostics))])
                        continue
                    data.extend(block)
                    if len(data) > cap:
                        return None, "cli_output_limit"
            if _explicit_auth_failure(diagnostics):
                return None, "cli_auth"
        return None, "cli_timeout"
    except (OSError, ValueError):
        return None, "cli_execution"
    finally:
        if proc is not None:
            if proc.returncode is None:
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            proc.stdout.close()
            if proc.stderr is not None:
                proc.stderr.close()
            try:
                proc.wait(timeout=.25)
            except subprocess.TimeoutExpired:
                pass


def _version_ok(raw):
    match = re.fullmatch(rb"(?:agy\s+(?:version\s+)?)?v?(\d{1,4})\.(\d{1,4})\.(\d{1,4})(?:\r?\n)?", raw or b"")
    return bool(match and (1, 1, 11) <= tuple(map(int, match.groups())) < (2, 0, 0))


def agy_quota_generation():
    with _LOCK:
        return _generation


def wait_for_agy_quota_update(generation, timeout=20):
    # Taking the generation before rendering also covers a completion between
    # rendering and wait. Never clear a shared Event between SSE clients.
    with _UPDATED:
        _UPDATED.wait_for(lambda: _generation != generation, timeout=timeout)
        return _generation


def _notify_locked():
    global _generation
    _generation += 1
    _UPDATED.notify_all()


def _cache_path():
    root = Path(os.path.expanduser(os.environ.get("TOOTOO_HOME") or "~/.tootoo"))
    return root / _CACHE_NAME


def _snapshot_key(home, binary):
    info = binary.stat()
    home_info = home.stat()
    scope = hashlib.sha256(repr((str(home.resolve()), home_info.st_dev, home_info.st_ino,
                                 str(binary), info.st_dev, info.st_ino, info.st_mtime_ns,
                                 info.st_size, os.getuid())).encode()).hexdigest()
    return _cache_path().parent.resolve(), scope


def _private_path(key):
    # Do not follow a cache-file symlink; the key only canonicalizes the parent.
    return key[0] / _CACHE_NAME


def _validated_snapshot(raw, now):
    if not isinstance(raw, dict):
        return None
    fetched, buckets = raw.get("fetched_at"), raw.get("buckets")
    if (type(fetched) not in (int, float) or not 0 <= now - fetched < _MAX_AGE or
            not isinstance(buckets, list) or not 0 < len(buckets) <= len(_BUCKETS)):
        return None
    seen, out = set(), []
    for bucket in buckets:
        if not isinstance(bucket, dict):
            return None
        provider_id = bucket.get("provider_bucket_id")
        known = _BUCKETS.get(provider_id) if isinstance(provider_id, str) else None
        rem, reset = bucket.get("remaining_fraction"), bucket.get("resets_at")
        if (not known or provider_id in seen or type(rem) not in (int, float) or
                not 0 <= rem <= 1 or (reset is not None and
                (type(reset) not in (int, float) or not 0 < reset < float("inf")))):
            return None
        seen.add(provider_id)
        if reset is not None and reset <= now:
            continue
        short, group_id, group, window, minutes = known
        out.append({"id": short, "provider_bucket_id": provider_id, "group_id": group_id,
                    "group_label": group, "label": group + (" · 5h" if window == "5h" else " · Weekly"),
                    "window_minutes": minutes, "remaining_fraction": rem,
                    "used_percent": round(100 * (1 - rem), 8), "resets_at": reset})
    return {"source": "cli_cached", "ts": fetched, "buckets": out} if out else None


def _only_quota(quota):
    return {"fetched_at": quota["ts"], "buckets": [
        {k: b[k] for k in ("provider_bucket_id", "remaining_fraction", "resets_at")}
        for b in quota["buckets"]]}


def _load_snapshot(key):
    try:
        fd = os.open(_private_path(key), os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(fd, "rb") as file:
            info = os.fstat(file.fileno())
            if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or
                    stat.S_IMODE(info.st_mode) != 0o600 or info.st_size > _MAX_CONFIG):
                return None
            data = _json(file.read(_MAX_CONFIG + 1))
        if isinstance(data, dict) and data.get("scope") == key[1] and data.get("version") == 1:
            return _validated_snapshot(data, time.time())
    except (OSError, ValueError, RecursionError):
        pass
    return None


def _save_snapshot(key, quota):
    path = _private_path(key)
    tmp = None
    try:
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(prefix=".agy-quota-", dir=path.parent)
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump({"version": 1, "scope": key[1], **_only_quota(quota)}, file, allow_nan=False)
            file.flush()
            os.fsync(file.fileno())
        os.replace(tmp, path)
    except (OSError, ValueError):
        pass  # last good in-memory quota is still useful
    finally:
        if tmp is not None:
            try:
                os.unlink(tmp)
            except OSError:
                pass


def _purge_snapshot():
    try:
        _cache_path().unlink(missing_ok=True)
    except OSError:
        pass


def _cancel(purge=False):
    global _cache_key, _cache_result, _cache_until, _cache_reason
    _cache_key, _cache_result, _cache_until, _cache_reason = None, None, 0, None
    if _pending is not None:
        _pending[1].set()
    if purge:
        _purge_snapshot()
    return _pending


def stop_agy_cli_quota():
    """Stop an owned probe without wiping the same-scope startup cache."""
    with _LOCK:
        work = _cancel()
    if work is not None:
        work[2].join(timeout=.8)


def _collect(home, binary, key, cancelled):
    global _pending, _cache_result, _cache_until, _cache_reason
    result = _result("unavailable", "cli_execution")
    try:
        username = pwd.getpwuid(os.getuid()).pw_name
        env = {"HOME": str(home), "USER": username, "LOGNAME": username,
               "PATH": "/usr/bin:/bin:/usr/sbin:/sbin", "LANG": "en_US.UTF-8", "NO_COLOR": "1"}
        with tempfile.TemporaryDirectory(prefix="tootoo-agy-") as cwd:
            version, reason = _exec(binary, ["--version"], cwd, env, 2.0, 2048, cancelled)
            if reason is not None:
                result = _result("unavailable", reason)
            elif not _version_ok(version):
                result = _result("unavailable", "cli_version")
            elif not _safe_settings(home):
                result = _result("unavailable", "cli_settings")
            elif _find_agy(home) == binary and _snapshot_key(home, binary) == key:
                raw, reason = _exec(binary, ["-p", "/usage", "--output-format", "json"], cwd, env,
                                    _USAGE_TIMEOUT, _MAX_RESPONSE, cancelled)
                quota = parse_usage(raw, time.time()) if raw is not None else None
                result = (_result("live", quota=quota) if quota else
                          _result("unavailable", reason or "cli_shape"))
    except (OSError, KeyError, RuntimeError):
        pass
    finally:
        with _UPDATED:
            _pending = None
            if not cancelled.is_set() and key == _cache_key:
                quota = result["quota"]
                _cache_reason = result["status"]["reason"]
                _cache_until = time.monotonic() + (_TTL if quota else _FAILURE_TTL)
                if quota:
                    # Normalize away arbitrary/possibly identifying CLI labels.
                    _cache_result = _validated_snapshot(_only_quota(quota), time.time())
                    _save_snapshot(key, quota)
                    resets = [b["resets_at"] for b in quota["buckets"] if b["resets_at"] is not None]
                    if resets:
                        _cache_until = min(_cache_until, time.monotonic() + max(0, min(resets) - time.time()))
                elif _cache_reason in {"cli_auth", "cli_settings"}:
                    _cache_result = None
                    _purge_snapshot()
                _notify_locked()


def _prepare_cache(purge_invalid=False):
    global _cache_key, _cache_result, _cache_until, _cache_reason
    home = Path.home()
    if not _safe_settings(home):
        _cancel(purge=purge_invalid)
        return home, None, "cli_settings"
    binary = _find_agy(home)
    if binary is None:
        _cancel()
        return home, None, "cli_missing"
    try:
        key = _snapshot_key(home, binary)
    except (OSError, RuntimeError):
        _cancel()
        return home, None, "cli_execution"
    if key != _cache_key:
        _cancel()
        _cache_key = key
        _cache_result = _load_snapshot(key)
    return home, binary, None


def prime_agy_cli_quota():
    """Load the same-scope disk snapshot before backend startup scanning."""
    with _LOCK:
        _prepare_cache(purge_invalid=True)


def fetch_agy_cli_quota(enabled: bool):
    """Return the previous quota immediately, even while refresh is pending."""
    global _pending
    with _UPDATED:
        if enabled is not True:
            had_state = _cache_result is not None or _pending is not None
            _cancel(purge=True)
            if had_state:
                _notify_locked()
            return _result("disabled")
        home, binary, reason = _prepare_cache(purge_invalid=True)
        if reason:
            return _result("unavailable", reason)
        refreshing = _pending is not None and not _pending[1].is_set()
        if _pending is None and time.monotonic() >= _cache_until:
            cancelled = threading.Event()
            thread = threading.Thread(target=_collect, args=(home, binary, _cache_key, cancelled),
                                      name="agy-quota", daemon=True)
            _pending = (_cache_key, cancelled, thread)
            thread.start()
            refreshing = True
        now = time.time()
        cached = _validated_snapshot(_only_quota(_cache_result), now) if _cache_result is not None else None
        if cached is not None:
            result = _result("cached", _cache_reason, cached)
            result["status"].update(
                refreshing=refreshing, fetched_at=cached["ts"],
                cache_state="stale" if refreshing or _cache_reason or now - cached["ts"] >= _TTL
                or len(cached["buckets"]) < len(_cache_result["buckets"]) else "fresh")
            return result
        return _result("loading" if refreshing or _cache_reason is None else "unavailable",
                       _cache_reason)
