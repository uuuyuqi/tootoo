"""Read the local Codex CLI quota over documented App Server JSONL, without turns."""
from __future__ import annotations

import copy
from contextlib import suppress
import json
import os
import platform
import re
import selectors
import signal
import stat
import struct
import subprocess
import tempfile
import threading
import time
from pathlib import Path

TTL = 60
BACKOFF = 120
TIMEOUT = 20.0
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


_NPM_ARCH = {
    "arm64": ("arm64", "aarch64-apple-darwin", 0x0100000C),
    "x86_64": ("x64", "x86_64-apple-darwin", 0x01000007),
}
_NPM_WRAPPER = Path("lib/node_modules/@openai/codex/bin/codex.js")
_MAX_NPM_MANIFEST = 64 * 1024
_NPM_VERSION = re.compile(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?")


def _npm_dirs_are_trusted(prefix, directory, admin_gid):
    # Only the launcher symlink itself is allowed. Reject pnpm stores, linked
    # packages and any intermediate symlink, including the maintained prefix.
    if prefix != prefix.resolve(strict=True):
        return False
    for directory in (directory, *directory.parents):
        if directory == prefix.parent:
            return True
        info = directory.lstat()
        if (not stat.S_ISDIR(info.st_mode) or info.st_uid not in (0, os.getuid()) or
                info.st_mode & 0o002 or (info.st_mode & 0o020 and info.st_gid != admin_gid)):
            return False
    return False


def _npm_regular(info):
    return stat.S_ISREG(info.st_mode) and info.st_uid in (0, os.getuid()) and not info.st_mode & 0o022


def _npm_manifest(path):
    # These are public package manifests, not account/user configuration.
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, "rb") as file:
        info = os.fstat(file.fileno())
        if not _npm_regular(info) or info.st_size > _MAX_NPM_MANIFEST:
            return None
        raw = file.read(_MAX_NPM_MANIFEST + 1)
    if len(raw) > _MAX_NPM_MANIFEST:
        return None
    data = json.loads(raw)
    return data if isinstance(data, dict) else None


def _npm_macho_executable(path, cpu):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, "rb") as file:
        info = os.fstat(file.fileno())
        if not _npm_regular(info) or not os.access(path, os.X_OK):
            return False

        def native_slice(offset):
            file.seek(offset)
            header = file.read(32)
            endian = {b"\xcf\xfa\xed\xfe": "<", b"\xfe\xed\xfa\xcf": ">"}.get(header[:4])
            return bool(len(header) == 32 and endian and
                        struct.unpack_from(endian + "I", header, 4)[0] == cpu and
                        struct.unpack_from(endian + "I", header, 12)[0] == 2)  # MH_EXECUTE

        magic = file.read(4)
        fat = {b"\xca\xfe\xba\xbe": (">", False), b"\xca\xfe\xba\xbf": (">", True),
               b"\xbe\xba\xfe\xca": ("<", False), b"\xbf\xba\xfe\xca": ("<", True)}.get(magic)
        if fat is None:
            return native_slice(0)
        endian, fat64 = fat
        count_bytes = file.read(4)
        if len(count_bytes) != 4:
            return False
        count, = struct.unpack(endian + "I", count_bytes)
        record = struct.Struct(endian + ("IIQQII" if fat64 else "IIIII"))
        if not 0 < count <= 16:
            return False
        table = file.read(count * record.size)
        if len(table) != count * record.size:
            return False
        return any(arch == cpu and off >= 8 + len(table) and size >= 32 and
                   off + size <= info.st_size and native_slice(off)
                   for arch, _subtype, off, size, *_unused in record.iter_unpack(table))


def _resolve_npm(prefix, machine):
    arch = _NPM_ARCH.get(machine)
    if arch is None:
        return None
    npm_arch, triple, cpu = arch
    admin_gid = _homebrew_admin_gid()
    entry = prefix / "bin/codex"
    wrapper = prefix / _NPM_WRAPPER
    root = wrapper.parent.parent
    try:
        if not _npm_dirs_are_trusted(prefix, entry.parent, admin_gid):
            return None
        link = entry.lstat()
        if not stat.S_ISLNK(link.st_mode) or link.st_uid not in (0, os.getuid()):
            return None
        # A single standard npm symlink, not a general command-line resolver.
        if os.readlink(entry) not in (str(wrapper), "../" + str(_NPM_WRAPPER)):
            return None
        if not _npm_dirs_are_trusted(prefix, wrapper.parent, admin_gid) or not _npm_regular(wrapper.lstat()):
            return None
        package = _npm_manifest(root / "package.json")
        if not package or package.get("name") != "@openai/codex" or package.get("bin") != {"codex": "bin/codex.js"}:
            return None
        version = package.get("version")
        if not isinstance(version, str) or len(version) > 80 or not _NPM_VERSION.fullmatch(version):
            return None
        flavor = f"darwin-{npm_arch}"
        dependency = f"codex-{flavor}"
        expected_version = f"{version}-{flavor}"
        optional = package.get("optionalDependencies")
        if not isinstance(optional, dict) or optional.get(f"@openai/{dependency}") != f"npm:@openai/codex@{expected_version}":
            return None
        for native in (root / f"node_modules/@openai/{dependency}", root.parent / dependency):
            # Match npm's nested-before-hoisted search only when no nested
            # package exists. Do not bypass an invalid or linked nested package.
            if not os.path.lexists(native):
                continue
            if not _npm_dirs_are_trusted(prefix, native, admin_gid):
                return None
            metadata = _npm_manifest(native / "package.json")
            if not metadata or metadata.get("name") != "@openai/codex" or metadata.get("version") != expected_version:
                return None
            if metadata.get("os") != ["darwin"] or metadata.get("cpu") != [npm_arch]:
                return None
            for layout in ("bin/codex", "codex/codex"):
                candidate = native / "vendor" / triple / layout
                if not os.path.lexists(candidate):
                    continue
                if not _npm_dirs_are_trusted(prefix, candidate.parent, admin_gid):
                    return None
                return candidate if _npm_macho_executable(candidate, cpu) else None
            return None
    except (OSError, ValueError, RecursionError, RuntimeError):
        return None
    return None


def _find_codex():
    # Known standard paths only, never arbitrary PATH or a configurable command.
    machine = platform.machine()
    prefixes = ("/usr/local", "/opt/homebrew") if machine == "x86_64" else ("/opt/homebrew", "/usr/local")
    for base in prefixes:
        prefix = Path(base)
        path = _resolve_homebrew(prefix) or _resolve_npm(prefix, machine)
        if path is not None:
            return path
    return None


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
    phase = "cli_spawn"
    try:
        if cancelled.is_set():
            return _status("unavailable", "cli_cancelled")
        proc = subprocess.Popen([str(binary), *APP_SERVER_ARGS], cwd=cwd, env=env,
                                stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, start_new_session=True)
        phase = "cli_pipe"
        fd_in, fd_out = proc.stdin.fileno(), proc.stdout.fileno()
        os.set_blocking(fd_in, False)
        os.set_blocking(fd_out, False)

        def send(message):
            data = (json.dumps(message, separators=(",", ":")) + "\n").encode()
            if (cancelled.is_set() or time.monotonic() >= deadline or
                    os.write(fd_in, data) != len(data)):
                raise OSError("RPC unavailable")

        phase = "cli_write"
        send({"id": 1, "method": "initialize", "params": {
            "clientInfo": {"name": "tootoo_quota", "title": "TooToo quota reader", "version": "1.0.0"}}})
        expected = 1
        pending = bytearray()
        total = 0
        # Use portable select for this one pipe. On Darwin kqueue can report
        # a close/read transition while a nonblocking read has no bytes yet.
        phase = "cli_select"
        with selectors.SelectSelector() as selector:
            selector.register(fd_out, selectors.EVENT_READ)
            while (remaining := deadline - time.monotonic()) > 0:
                if cancelled.is_set():
                    return _status("unavailable", "cli_cancelled")
                phase = "cli_select"
                if not selector.select(min(.1, remaining)):
                    continue
                phase = "cli_read"
                try:
                    part = os.read(fd_out, 8192)
                except (BlockingIOError, InterruptedError):
                    continue
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
                        phase = "cli_write"
                        send({"method": "initialized", "params": {}})
                        send({"id": 2, "method": "account/rateLimits/read"})
                    else:
                        quota = parse_rate_limits(msg["result"], time.time())
                        return _status("live", quota=quota) if quota else _status("no_data", "cli_no_quota")
        return _status("unavailable", "cli_timeout")
    except (OSError, ValueError):
        return _status("unavailable", "cli_cancelled" if cancelled.is_set() else phase)
    finally:
        if proc is not None:
            # Closing stdin also lets a CLI end normally. Failures during
            # cleanup must not erase a quota response already parsed above.
            with suppress(OSError):
                proc.stdin.close()
            # No wait/poll before this signal: the owned group leader cannot
            # have its PID recycled into an unrelated process group.
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except OSError:
                # A process may already have exited or Darwin may reject the
                # group operation. Fall back to the still-owned direct child,
                # without discarding already validated server data.
                with suppress(OSError):
                    proc.kill()
            with suppress(OSError, subprocess.TimeoutExpired):
                proc.wait(timeout=.25)
            with suppress(OSError):
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
