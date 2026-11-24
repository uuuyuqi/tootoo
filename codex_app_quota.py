"""Opt-in quota reader for the current Codex CLI account via official App Server."""
from __future__ import annotations

import copy
import json
import os
import selectors
import shutil
import signal
import subprocess
import threading
import time
from pathlib import Path
from typing import Any

OPT_IN = "TOOTOO_CODEX_APP_SERVER"
TTL = 60
TIMEOUT = 4.0
MAX_OUTPUT = 256 * 1024

def _bucket(raw: Any, now: float) -> dict | None:
    if not isinstance(raw, dict):
        return None
    used, mins, reset = (raw.get(k) for k in ("usedPercent", "windowDurationMins", "resetsAt"))
    if type(used) not in (float, int) or not 0 <= used <= 100:
        return None
    if type(mins) is not int or not 0 < mins <= 525600:
        return None
    if reset is not None:
        if type(reset) is not int or not now < reset <= now + 31536000:
            return None
    return {"used_percent": used, "window_minutes": mins, "resets_at": reset}


def parse_rate_limits(result: Any, now: float) -> dict | None:
    if not isinstance(result, dict):
        return None
    limits = result.get("rateLimitsByLimitId")
    limit = limits.get("codex") if isinstance(limits, dict) else None
    if not isinstance(limit, dict):
        limit = result.get("rateLimits")
    # Don't treat a specialized model bucket as the generic allowance.
    if not isinstance(limit, dict) or limit.get("limitId") not in (None, "codex"):
        return None
    primary = _bucket(limit.get("primary"), now)
    secondary = _bucket(limit.get("secondary"), now)
    if primary is None and secondary is None:
        return None
    # Slots are independent, even when both report identical durations.
    return {"limit_id": "codex", "primary": primary, "secondary": secondary, "ts": now,
            "source": "app_server", "freshness": "live", "account_scope": "current_cli"}


def _child_env() -> dict[str, str]:
    # Use native CLI's own configured login, not tokens/API keys inherited from
    # TooToo or unrelated app/session environment variables.
    safe = {"HOME", "CODEX_HOME", "PATH", "LANG", "LC_ALL", "LC_CTYPE", "TMPDIR",
            "XDG_CONFIG_HOME", "XDG_CACHE_HOME", "XDG_DATA_HOME", "SYSTEMROOT"}
    return {k: v for k, v in os.environ.items() if k in safe}


def _probe(executable: str, *, timeout: float = TIMEOUT) -> tuple[str, dict | None]:
    deadline = time.monotonic() + timeout
    env = _child_env()
    # Finder's short PATH may omit the Node interpreter next to the CLI shim.
    env["PATH"] = os.path.dirname(executable) + os.pathsep + env.get("PATH", os.defpath)
    proc = None
    try:
        proc = subprocess.Popen([executable, "app-server", "--listen", "stdio://"],
                                stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, cwd=str(Path.home()),
                                env=env, start_new_session=True)
        assert proc.stdin is not None and proc.stdout is not None
        stdin, stdout = proc.stdin.fileno(), proc.stdout.fileno()
        os.set_blocking(stdin, False)
        os.set_blocking(stdout, False)

        def send(msg: dict):
            wire = (json.dumps(msg, separators=(",", ":")) + "\n").encode()
            if time.monotonic() >= deadline or os.write(stdin, wire) != len(wire):
                raise OSError("request could not be sent")

        send({"id": 1, "method": "initialize",
              "params": {"clientInfo": {"name": "tootoo_quota", "version": "1.0.0"}}})
        expected = 1
        buffer = bytearray()
        total = 0
        with selectors.DefaultSelector() as selector:
            selector.register(stdout, selectors.EVENT_READ)
            while (remaining := deadline - time.monotonic()) > 0 and selector.select(remaining):
                chunk = os.read(stdout, 8192)
                total += len(chunk)
                if not chunk or total > MAX_OUTPUT:
                    break
                buffer.extend(chunk)
                while (newline := buffer.find(b"\n")) >= 0:
                    line = bytes(buffer[:newline])
                    del buffer[:newline + 1]
                    try:
                        response = json.loads(line)
                    except (ValueError, RecursionError):
                        continue
                    if (not isinstance(response, dict) or "method" in response or
                            type(response.get("id")) is not int or response["id"] != expected):
                        continue
                    if "error" in response or not isinstance(response.get("result"), dict):
                        return "unavailable", None
                    if expected == 1:
                        expected = 2
                        send({"method": "initialized"})
                        send({"id": 2, "method": "account/rateLimits/read"})
                    else:
                        quota = parse_rate_limits(response["result"], time.time())
                        return ("live", quota) if quota else ("no_data", None)
    except (OSError, ValueError, NotImplementedError):
        pass
    finally:
        if proc is not None:
            # Close pipes and terminate the newly created process group (CLI
            # launchers may be wrappers). Never touch another Codex session.
            if proc.stdin is not None:
                proc.stdin.close()
            if proc.stdout is not None:
                proc.stdout.close()
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            try:
                proc.wait(timeout=0.5)
            except subprocess.TimeoutExpired:
                pass
    return "unavailable", None


class CodexQuotaReader:
    def __init__(self):
        self._lock = threading.Lock()
        self._key: tuple[str, str | None] | None = None
        self._result: dict | None = None
        self._status = "unavailable"
        self._until = 0.0

    def fetch(self) -> tuple[str, dict | None]:
        if os.environ.get(OPT_IN) != "1":
            with self._lock:
                self._key, self._result, self._until = None, None, 0.0
            return "disabled", None
        executable = shutil.which("codex")
        if not executable and os.environ.get("TOOTOO_DEBUG") == "1":
            # GUI launches do not inherit interactive shell PATH configuration.
            executable = shutil.which("codex", path="/opt/homebrew/bin:/usr/local/bin")
        if not executable:
            return "unavailable", None
        key = (os.path.abspath(executable), os.environ.get("CODEX_HOME"))
        with self._lock:
            if os.environ.get(OPT_IN) != "1":
                return "disabled", None
            if self._key != key or self._until <= time.monotonic():
                status, result = _probe(key[0])
                self._key, self._status, self._result = key, status, result
                self._until = time.monotonic() + TTL
                if result is not None:
                    resets = [slot["resets_at"] for slot in (result["primary"], result["secondary"])
                              if slot is not None and slot["resets_at"] is not None]
                    if resets:
                        self._until = min(self._until, time.monotonic() + max(0, min(resets) - time.time()))
            return self._status, copy.deepcopy(self._result)


reader = CodexQuotaReader()
