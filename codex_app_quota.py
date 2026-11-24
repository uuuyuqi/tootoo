"""Read the local Codex CLI quota over documented App Server JSONL, without turns."""
from __future__ import annotations

import copy
import json
import os
import platform
import selectors
import signal
import stat
import subprocess
import tempfile
import threading
import time
from pathlib import Path

TTL = 60
BACKOFF = 120
TIMEOUT = 12.0
MAX_BYTES = 256 * 1024
APP_SERVER_ARGS = (
    "-c", "analytics.enabled=false", "-c", 'otel.exporter="none"',
    "-c", 'otel.metrics_exporter="none"', "-c", 'otel.trace_exporter="none"',
    "app-server", "--listen", "stdio://",
)
_MACHO = {b"\xcf\xfa\xed\xfe", b"\xfe\xed\xfa\xcf", b"\xca\xfe\xba\xbe", b"\xca\xfe\xba\xbf"}
_LOCK = threading.Lock()
_pending = None
_key = None
_last = None
_until = 0.0


def _status(state, reason=None, quota=None):
    return {"quota": quota, "status": {"state": state, "reason": reason,
                                      "cache_state": "fresh" if quota is not None else "none"}}


def _bucket(raw, now):
    if not isinstance(raw, dict):
        return None
    used, mins, reset = (raw.get(k) for k in ("usedPercent", "windowDurationMins", "resetsAt"))
    if type(used) not in (int, float) or not 0 <= used <= 100:
        return None
    if type(mins) is not int or not 0 < mins <= 525600:
        return None
    if reset is not None and (type(reset) is not int or not now < reset <= now + 31536000):
        return None
    return {"used_percent": used, "window_minutes": mins, "resets_at": reset}


def parse_rate_limits(result, now):
    if not isinstance(result, dict):
        return None
    limits = result.get("rateLimitsByLimitId")
    limit = limits.get("codex") if isinstance(limits, dict) else None
    if limit is None:
        limit = result.get("rateLimits")
    if not isinstance(limit, dict) or limit.get("limitId") not in (None, "codex"):
        return None
    primary = _bucket(limit.get("primary"), now)
    secondary = _bucket(limit.get("secondary"), now)
    if primary is None and secondary is None:
        return None
    return {"limit_id": "codex", "primary": primary, "secondary": secondary, "ts": now,
            "source": "app_server", "freshness": "live", "account_scope": "current_cli"}


def _homebrew_admin_gid():
    # Standard macOS Homebrew may use admin-owned group-writable directories.
    # A normal user must not be able to substitute a CLI on another profile.
    if platform.system() == "Darwin":
        import grp
        try:
            return grp.getgrnam("admin").gr_gid
        except KeyError:
            pass
    return None


def _resolve_homebrew(prefix):
    expected = prefix / "bin/codex"
    try:
        actual = expected.resolve(strict=True)
        if actual != expected and not any(root in actual.parents for root in (
                prefix / "Caskroom/codex", prefix / "Cellar/codex")):
            return None
        # Containment alone is not enough if a different local uid can
        # replace a subdirectory or executable under a trusted prefix.
        admin_gid = _homebrew_admin_gid()
        for parent in {prefix, expected.parent, *[d for d in actual.parents if prefix in d.parents]}:
            info = parent.stat()
            if (not stat.S_ISDIR(info.st_mode) or info.st_uid not in (0, os.getuid()) or
                    info.st_mode & 0o002 or (info.st_mode & 0o020 and info.st_gid != admin_gid)):
                return None
        meta = actual.stat()
        if (not stat.S_ISREG(meta.st_mode) or meta.st_uid not in (0, os.getuid()) or
                meta.st_mode & 0o022 or not os.access(actual, os.X_OK)):
            return None
        with actual.open("rb") as source:
            if source.read(4) not in _MACHO:
                return None
        return actual
    except (OSError, RuntimeError):
        return None


def _find_codex():
    # Only conventional Apple Silicon / Intel Homebrew paths. Do not resolve a
    # command from user/project PATH, a shell alias, or an environment override.
    prefixes = ("/opt/homebrew", "/usr/local")
    if platform.machine() == "x86_64":
        prefixes = prefixes[::-1]
    return next((path for p in prefixes if (path := _resolve_homebrew(Path(p))) is not None), None)


def _context():
    home = Path.home()
    raw = os.environ.get("CODEX_HOME")
    if raw:
        configured = Path(raw)
        if not configured.is_absolute():
            raise ValueError("relative Codex home")
        codex_home = configured.resolve(strict=True)
        if not codex_home.is_dir():
            raise ValueError("invalid Codex home")
    else:
        codex_home = (home / ".codex").resolve()
    return home, codex_home, bool(raw)


def codex_cli_home():
    """Same canonical profile used by the collector; no credential inspection."""
    try:
        return _context()[1]
    except (OSError, ValueError, RuntimeError):
        return None


def _key_for(binary, context):
    meta = binary.stat()
    return binary, context, meta.st_dev, meta.st_ino, meta.st_mtime_ns, meta.st_size


def _probe(binary, cwd, env, cancelled, timeout=TIMEOUT):
    deadline = time.monotonic() + timeout
    proc = None
    try:
        if cancelled.is_set():
            return _status("unavailable", "cli_cancelled")
        proc = subprocess.Popen([str(binary), *APP_SERVER_ARGS], cwd=cwd, env=env,
                                stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, start_new_session=True)
        fd_in, fd_out = proc.stdin.fileno(), proc.stdout.fileno()
        os.set_blocking(fd_in, False)
        os.set_blocking(fd_out, False)

        def send(message):
            data = (json.dumps(message, separators=(",", ":")) + "\n").encode()
            if (cancelled.is_set() or time.monotonic() >= deadline or
                    os.write(fd_in, data) != len(data)):
                raise OSError("RPC unavailable")

        send({"id": 1, "method": "initialize", "params": {
            "clientInfo": {"name": "tootoo_quota", "title": "TooToo quota reader", "version": "1.0.0"}}})
        expected = 1
        pending = bytearray()
        total = 0
        with selectors.DefaultSelector() as selector:
            selector.register(fd_out, selectors.EVENT_READ)
            while (remaining := deadline - time.monotonic()) > 0:
                if cancelled.is_set():
                    return _status("unavailable", "cli_cancelled")
                if not selector.select(min(.1, remaining)):
                    continue
                part = os.read(fd_out, 8192)
                if not part:
                    return _status("unavailable", "cli_exit")
                total += len(part)
                if total > MAX_BYTES:
                    return _status("unavailable", "cli_output_limit")
                pending.extend(part)
                while (newline := pending.find(b"\n")) >= 0:
                    line = bytes(pending[:newline])
                    del pending[:newline + 1]
                    try:
                        msg = json.loads(line)
                    except (ValueError, RecursionError):
                        continue
                    # Never handle notifications or reply to auth refresh or
                    # any other server-to-client request, even with a matching ID.
                    if not isinstance(msg, dict) or "method" in msg or type(msg.get("id")) is not int or msg["id"] != expected:
                        continue
                    if "error" in msg or not isinstance(msg.get("result"), dict):
                        return _status("unavailable", "cli_rpc_error")
                    if expected == 1:
                        expected = 2
                        send({"method": "initialized", "params": {}})
                        send({"id": 2, "method": "account/rateLimits/read"})
                    else:
                        quota = parse_rate_limits(msg["result"], time.time())
                        return _status("live", quota=quota) if quota else _status("no_data", "cli_no_quota")
        return _status("unavailable", "cli_timeout")
    except (OSError, ValueError):
        return _status("unavailable", "cli_cancelled" if cancelled.is_set() else "cli_execution")
    finally:
        if proc is not None:
            proc.stdin.close()
            # Reap the entire group even if the direct CLI exited but another
            # process inherited its pipe. The leader has not yet been reaped,
            # so its PID cannot have been recycled into another process group.
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            try:
                proc.wait(timeout=.25)
            except subprocess.TimeoutExpired:
                pass
            proc.stdout.close()


def _clear():
    global _key, _last, _until
    _key, _last, _until = None, None, 0.0
    if _pending is not None:
        _pending[0].set()
    return _pending


def stop_codex_cli_quota():
    with _LOCK:
        work = _clear()
    if work is not None:
        work[1].join(timeout=.8)


def _collect(binary, key, context, cancelled):
    global _pending, _last, _until
    result = _status("unavailable", "cli_execution")
    try:
        home, codex_home, override = context
        env = {"HOME": str(home), "PATH": "/usr/bin:/bin:/usr/sbin:/sbin", "LANG": "en_US.UTF-8",
               "NO_COLOR": "1"}
        if override:
            env["CODEX_HOME"] = str(codex_home)
        with tempfile.TemporaryDirectory(prefix="tootoo-codex-quota-") as cwd:
            if _find_codex() == binary and _key_for(binary, _context()) == key:
                result = _probe(binary, cwd, env, cancelled)
    except (OSError, ValueError, RuntimeError):
        pass
    finally:
        with _LOCK:
            _pending = None
            if cancelled.is_set() or key != _key:
                return
            _last = result
            quota = result["quota"]
            duration = TTL if quota else BACKOFF
            if quota:
                resets = [b["resets_at"] for b in (quota["primary"], quota["secondary"])
                          if b is not None and b["resets_at"] is not None]
                if resets:
                    duration = min(duration, max(0, min(resets) - time.time()))
            _until = time.monotonic() + duration


def _view():
    if _pending is not None and not _pending[0].is_set():
        return _status("loading")
    if _last is None or _until <= time.monotonic():
        return _status("disabled" if _key is None else "unavailable")
    result = copy.deepcopy(_last)
    if result["quota"] is not None:
        result["status"]["state"] = "cached"
        result["quota"]["freshness"] = "recent"
    return result


def peek_codex_app_quota():
    """Side-effect-free snapshot suitable for HTTP rendering; never starts processes."""
    with _LOCK:
        return _view()


def fetch_codex_cli_quota(enabled: bool):
    """Native-owned scheduler only. Returns immediately; at most one child."""
    global _key, _last, _until, _pending
    with _LOCK:
        if enabled is not True:
            _clear()
            return _status("disabled")
        binary = None
        try:
            binary = _find_codex()
            if binary is None:
                raise FileNotFoundError()
            context = _context()
            key = _key_for(binary, context)
        except (OSError, ValueError, RuntimeError) as err:
            _clear()
            _last = _status("unavailable", "cli_missing" if isinstance(err, FileNotFoundError) and binary is None
                            else "cli_context")
            _until = time.monotonic() + BACKOFF
            return _view()
        if key != _key:
            _clear()
            _key = key
        if _pending is None and (_last is None or _until <= time.monotonic()):
            cancelled = threading.Event()
            thread = threading.Thread(target=_collect, args=(binary, key, context, cancelled), daemon=True)
            _pending = cancelled, thread
            thread.start()
        return _view()
