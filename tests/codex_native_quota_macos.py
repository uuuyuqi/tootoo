"""Launch the exact packaged Debug binary, own its backend and use only a fake CLI."""
from contextlib import ExitStack
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import build_opener, ProxyHandler
import json
import os
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
spec = spec_from_file_location("stop_debug", ROOT / "macos/stop_debug.py")
stop_debug = module_from_spec(spec)
spec.loader.exec_module(stop_debug)
darwin = stop_debug.DarwinProcesses()
opener = build_opener(ProxyHandler({}))

FAKE_CODEX = r'''#!/usr/bin/env python3
import json, os, sys, time
assert sys.argv[1:] == ["app-server", "--listen", "stdio://"]
with open(os.path.join(os.environ["HOME"], "fake-launches"), "a", encoding="utf-8") as f:
    f.write("fake\n")
for line in sys.stdin:
    req = json.loads(line)
    method = req["method"]
    if method == "initialize":
        answer = {}
    elif method == "initialized":
        continue
    elif method == "account/rateLimits/read":
        answer = {"rateLimits": {"limitId": "codex",
            "primary": {"usedPercent": 0, "windowDurationMins": 300, "resetsAt": int(time.time()) + 300},
            "secondary": {"usedPercent": 5, "windowDurationMins": 10080, "resetsAt": int(time.time()) + 3600}}}
    else:
        raise AssertionError("unexpected method")
    print(json.dumps({"id": req["id"], "result": answer}), flush=True)
'''

def stop_process(p):
    if p.poll() is None:
        p.terminate()
        try:
            p.wait(timeout=5)
        except subprocess.TimeoutExpired:
            p.kill()
            p.wait(timeout=5)

def listeners(pid):
    process = subprocess.run(["/usr/sbin/lsof", "-nP", "-a", "-p", str(pid),
                              "-iTCP", "-sTCP:LISTEN", "-Fn"],
                             capture_output=True, text=True)
    for line in process.stdout.splitlines():
        if line.startswith("n127.0.0.1:") and line.rsplit(":", 1)[1].isdigit():
            yield int(line.rsplit(":", 1)[1])

def read_local(port, path, timeout=12):
    with opener.open(f"http://127.0.0.1:{port}{path}",timeout=timeout) as response:
        return json.load(response)

def find_backend(p, expected_balance, timeout=32):
    timestamp = time.monotonic() + timeout
    observed = {}
    while time.monotonic() < timestamp and p.poll() is None:
        for pid, (ppid, uid) in darwin.table().items():
            if (ppid, uid) != (p.pid, os.getuid()):
                continue
            ports = set(listeners(pid))
            args = darwin.argv(pid) or []
            if b"--port" in args:
                i = args.index(b"--port")
                if i+1 < len(args) and args[i+1].isdigit():
                    ports.add(int(args[i+1]))
            executable = darwin.path(pid)
            observed[pid] = (os.path.basename(os.fsdecode(executable)) if executable else None, len(args), sorted(ports))
            for port in ports:
                try:
                    if read_local(port, "/api/carrot", timeout=1).get("balance") == expected_balance:
                        print(f"Exact app {p.pid} owns backend {pid} and port {port}; isolated state verified", flush=True)
                        return pid, port
                except (OSError, ValueError) as error:
                    observed[pid] = (*observed[pid], type(error).__name__)
                    continue
        time.sleep(.2)
    raise AssertionError(f"packaged Debug backend not found (app exit={p.poll()}; direct children={observed})")

def stop_backend(pid, parent):
    if darwin.table().get(pid) == (parent, os.getuid()):
        try:
            os.kill(pid, 15)
        except ProcessLookupError:
            pass

def start(app, scenario, home, bin_path, cleanup):
    binary = app / "Contents/MacOS/TooToo-Debug"
    expected_balance = 271 if scenario == "explicit" else 193
    paths = {key: home / name for key, name in [("CODEX_HOME",".codex"),("TOOTOO_HOME","trial-state")]}
    home.mkdir()
    for dest in paths.values():
        dest.mkdir()
    (paths["TOOTOO_HOME"] / "carrot_state.json").write_text(json.dumps({"balance":expected_balance}))
    env = {**os.environ, "HOME": str(home), "PATH": str(bin_path) + ":/usr/bin:/bin:/usr/sbin:/sbin",
           **{key:str(dest) for key,dest in paths.items()}}
    env.pop("TOOTOO_CODEX_APP_SERVER", None)
    if scenario == "explicit":
        env["TOOTOO_CODEX_APP_SERVER"] = "1"
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    p = subprocess.Popen([str(binary)], env=env, stdout=subprocess.DEVNULL)
    cleanup.callback(stop_process,p)
    child, port = find_backend(p,expected_balance)
    cleanup.callback(stop_backend,child,p.pid)
    return port

def snapshot(port):
    return read_local(port, "/api/telemetry?range=today&tool=all")

def main(app, phase):
    with TemporaryDirectory(prefix="tootoo-codex-native-") as tmp, ExitStack() as cleanup:
        root = Path(tmp).resolve()
        binaries = root/"bin"
        binaries.mkdir()
        fake = binaries/"codex"
        fake.write_text(FAKE_CODEX)
        fake.chmod(0o700)
        off, on = root/"off", root/"on"
        # Deliberately keep both named Debug apps alive; no request may be
        # misattributed to the older/unconsented instance.
        off_port = start(app,"default",off,binaries,cleanup)
        on_port = start(app,"explicit",on,binaries,cleanup)
        assert off_port != on_port
        a, b = snapshot(off_port), snapshot(on_port)
        assert a["quota_status"]["codex"]["state"] == "disabled"
        assert not a["quotas"].get("codex") and not (off/"fake-launches").exists()
        assert b["quota_status"]["codex"]["state"] == "live", b["quota_status"]["codex"]
        q = b["quotas"]["codex"]
        assert q["primary"]["used_percent"] == 0 and q["primary"]["window_minutes"] == 300
        assert q["secondary"]["used_percent"] == 5 and q["secondary"]["window_minutes"] == 10080
        assert q["source"] == "app_server" and q["account_scope"] == "current_cli"
        assert (on/"fake-launches").read_text().splitlines() == ["fake"]
        print(f"PASS {phase}: default off; explicit launch reads 10080-minute weekly from fake Codex; two app sockets remain isolated",flush=True)

if __name__ == "__main__":
    main(Path(sys.argv[1]).resolve(), sys.argv[2])
