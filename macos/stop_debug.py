"""Stop only this checkout's /Applications and dist TooToo-Debug instances."""
import ctypes
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

DEBUG_APP = "TooToo-Debug.app"
EXECUTABLE = "TooToo-Debug"
ROOT = Path(__file__).resolve().parent.parent


def debug_paths(root=ROOT):
    result = {}
    for app in (Path("/Applications") / DEBUG_APP, root / "dist" / DEBUG_APP):
        executable = app / "Contents" / "MacOS" / EXECUTABLE
        backend = app / "Contents" / "Resources" / "server.py"
        # Do not follow a pointer to a different app/binary as an allowed identity.
        if executable.resolve() == executable and backend.resolve() == backend:
            result[os.fsencode(executable)] = os.fsencode(backend)
    return result


class DarwinProcesses:
    def __init__(self):
        lib = ctypes.CDLL("/usr/lib/libproc.dylib", use_errno=True)
        self._path = lib.proc_pidpath
        self._path.argtypes = [ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32]
        self._path.restype = ctypes.c_int

        libc = ctypes.CDLL(None, use_errno=True)
        self._sysctl = libc.sysctl
        self._sysctl.argtypes = [
            ctypes.POINTER(ctypes.c_int), ctypes.c_uint, ctypes.c_void_p,
            ctypes.POINTER(ctypes.c_size_t), ctypes.c_void_p, ctypes.c_size_t,
        ]
        self._sysctl.restype = ctypes.c_int

    def table(self):
        out = subprocess.check_output(
            ["/bin/ps", "-axo", "pid=,ppid=,uid="], text=True,
        )
        return {p: (parent, uid) for p, parent, uid in
                (map(int, line.split()) for line in out.splitlines() if line.strip())}

    def path(self, pid):
        buf = ctypes.create_string_buffer(4096)  # PROC_PIDPATHINFO_MAXSIZE
        return buf.value if self._path(pid, buf, len(buf)) > 0 else None

    def argv(self, pid):
        mib = (ctypes.c_int * 3)(1, 49, pid)  # CTL_KERN, KERN_PROCARGS2
        n = ctypes.c_size_t()
        if self._sysctl(mib, 3, None, ctypes.byref(n), None, 0) or not 4 <= n.value <= 2**24:
            return None
        buf = ctypes.create_string_buffer(n.value)
        if self._sysctl(mib, 3, buf, ctypes.byref(n), None, 0):
            return None
        raw = buf.raw[:n.value]
        argc = int.from_bytes(raw[:4], sys.byteorder, signed=True)
        if argc <= 0:
            return None
        _exec_path, separator, args = raw[4:].partition(b"\0")
        if not separator:
            return None
        return args.lstrip(b"\0").split(b"\0", argc)[:argc]


def stop_debug(processes, paths, uid, *, terminate, sleep=time.sleep):
    def parent_matches(pid, path):
        row = processes.table().get(pid)
        return row is not None and row[1] == uid and processes.path(pid) == path

    def child_matches(pid, parent, backend):
        if processes.table().get(pid) != (parent, uid):
            return False
        args = processes.argv(pid)
        return args is not None and len(args) >= 2 and args[1] == backend

    def send(pid):
        try:
            terminate(pid)
        except ProcessLookupError:
            pass

    for pid, (_, owner) in processes.table().items():
        if owner != uid:
            continue
        path = processes.path(pid)
        if path not in paths or not parent_matches(pid, path):
            continue
        backend = paths[path]
        for child, (ppid, child_uid) in processes.table().items():
            if (ppid, child_uid) != (pid, uid):
                continue
            if not parent_matches(pid, path):
                break
            args = processes.argv(child)
            if args is None and processes.table().get(child) == (pid, uid):
                raise RuntimeError(f"Cannot verify Debug child PID {child}; aborting rebuild")
            if not (parent_matches(pid, path) and child_matches(child, pid, backend)):
                continue
            # Never send to an unverified PID (including similarly named CLI).
            send(child)
            for _ in range(40):
                if not child_matches(child, pid, backend):
                    break
                sleep(0.1)
            else:
                raise RuntimeError(f"Debug backend PID {child} did not exit; aborting rebuild")
        if parent_matches(pid, path):
            send(pid)
        for _ in range(40):
            if not parent_matches(pid, path):
                break
            sleep(0.1)
        else:
            raise RuntimeError(f"Debug app PID {pid} did not exit; aborting rebuild")


def main():
    if sys.platform != "darwin":
        raise SystemExit("TooToo debugging requires macOS")
    try:
        stop_debug(DarwinProcesses(), debug_paths(), os.getuid(),
                   terminate=lambda pid: os.kill(pid, signal.SIGTERM))
    except (RuntimeError, OSError, subprocess.SubprocessError) as e:
        raise SystemExit(str(e)) from e


if __name__ == "__main__":
    main()
