"""Test separately signed, packaged apps on a disposable macOS CI runner."""
from contextlib import ExitStack
import importlib.util
import json
import os
from pathlib import Path
import plistlib
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "dist" / "TooToo.app"
DEBUG = ROOT / "dist" / "TooToo-Debug.app"
spec = importlib.util.spec_from_file_location("stop_debug", ROOT / "macos/stop_debug.py")
stop_debug = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stop_debug)
proc = stop_debug.DarwinProcesses()


def info(app, name, bundle, debug):
    plist = plistlib.loads((app / "Contents/Info.plist").read_bytes())
    for key in ("CFBundleExecutable", "CFBundleName", "CFBundleDisplayName"):
        assert plist[key] == name, (key, plist[key], name)
    assert plist["CFBundleIdentifier"] == bundle
    binary = app / "Contents/MacOS" / name
    assert binary.is_file()
    subprocess.run(["/usr/bin/codesign", "--verify", "--deep", "--strict", app], check=True)
    strings = subprocess.check_output(["/usr/bin/strings", binary])
    html = (app / "Contents/Resources/ui/index.html").read_bytes()
    # Swift can encode short string constants as machine instructions.
    assert (b"TooToo-Debug Keep Awake (AI Coding)" in strings) == debug, name
    assert (b"TooToo Keep Awake (AI Coding)" in strings) != debug, name
    for token in (b'id="debugBar"', b'/*__TOOTOO_DEBUG_FLAG__*/true'):
        assert (token in html) == debug, (token, name)
    assert (app / "Contents/Resources/.release").exists() != debug
    arch = subprocess.check_output(["/usr/bin/lipo", "-archs", binary], text=True).strip()
    assert arch == os.uname().machine, arch
    print(f"PASS: {name}, {bundle}, {arch}, debug={debug}, signature valid", flush=True)
    return binary


def carrot(port, wanted, app_pid, backend, delay=20):
    path = os.fsencode(backend)
    deadline = time.monotonic() + delay
    while True:
        child = next((pid for pid, (ppid, uid) in proc.table().items()
                      if (ppid, uid) == (app_pid, os.getuid()) and
                      (argv := proc.argv(pid)) and len(argv) >= 2 and argv[1] == path), None)
        if child and subprocess.run(
            ["/usr/sbin/lsof", "-nP", "-a", "-p", str(child),
             f"-iTCP:{port}", "-sTCP:LISTEN"], stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        ).returncode == 0:
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/carrot", timeout=2) as response:
                    actual = json.load(response)["balance"]
                assert actual == wanted, (port, actual, wanted)
                print(f"PASS: TCP {port} owned by child {child} of app {app_pid}; balance {wanted}", flush=True)
                return child
            except urllib.error.URLError:
                pass
        if time.monotonic() > deadline:
            raise AssertionError(f"TooToo PID {app_pid} did not serve {port}; child={child}")
        time.sleep(0.2)


def seed(home, subdir, balance):
    data = home / subdir
    data.mkdir()
    (data / "carrot_state.json").write_text(json.dumps({"balance": balance}))
    (data / "pricing_remote.json").write_text(json.dumps({
        "version": 1, "updated_at": time.time(), "models": {},
    }))


def stop_child_if_owned(pid, parent, backend):
    if proc.table().get(pid) == (parent, os.getuid()):
        args = proc.argv(pid)
        if args and len(args) >= 2 and args[1] == os.fsencode(backend):
            try:
                os.kill(pid, 15)
            except ProcessLookupError:
                pass


def terminate_if_owned(pid, exact):
    if proc.table().get(pid, (None, None))[1] == os.getuid() and proc.path(pid) == os.fsencode(exact):
        try:
            os.kill(pid, 15)
        except ProcessLookupError:
            pass


with tempfile.TemporaryDirectory() as temp, ExitStack() as cleanup:
    home = Path(temp).resolve()
    env = {**os.environ, "HOME": str(home), "CODEX_HOME": str(home / ".codex"),
           "NO_INSTALL": "1", "PYTHONDONTWRITEBYTECODE": "1"}
    for key in ("TOOTOO_HOME", "TOOTOO_DEBUG", "UNIVERSAL"):
        env.pop(key, None)
    seed(home, ".tootoo", 11)
    seed(home, ".tootoo-debug", 22)
    seed(home, "override with spaces", 33)
    release_bin = info(APP, "TooToo", "com.tootoo.telemetry", False)
    debug_bin = info(DEBUG, "TooToo-Debug", "com.tootoo.telemetry.debug", True)
    release_hash = release_bin.read_bytes()
    release_backend = APP / "Contents/Resources/server.py"
    debug_backend = DEBUG / "Contents/Resources/server.py"
    orig = [subprocess.Popen([appbin], env=env, stdout=subprocess.DEVNULL) for appbin in (release_bin, debug_bin)]
    for p, apk in zip(orig, (release_bin, debug_bin)):
        cleanup.callback(terminate_if_owned, p.pid, apk)
    release_pid, debug_pid = (p.pid for p in orig)
    release_child = carrot(17891, 11, release_pid, release_backend)
    cleanup.callback(stop_child_if_owned, release_child, release_pid, release_backend)
    debug_child = carrot(17892, 22, debug_pid, debug_backend)

    # Same debug server script run outside the app (bundled CLI equivalent).
    # It must not be killed by an app restart; its PPID is not the debug app.
    sibling = subprocess.Popen([os.environ.get("PYTHON", "python3"), debug_backend, "--port", "17992", "--no-open"],
                               env={**env, "TOOTOO_HOME": "~/.tootoo-debug"}, stdout=subprocess.DEVNULL)
    cleanup.callback(sibling.terminate)
    restarted = subprocess.run(["bash", "macos/run_debug.sh"], cwd=ROOT, text=True,
                               env={**env, "TOOTOO_HOME": "~/override with spaces"},
                               stdout=subprocess.PIPE, check=True, timeout=75)
    print(restarted.stdout, end="")
    new_debug_pid = int(restarted.stdout.rsplit("(PID ", 1)[1].split(")", 1)[0])
    cleanup.callback(terminate_if_owned, new_debug_pid, debug_bin)
    orig[1].wait(timeout=10)
    assert proc.path(debug_child) is None, "old Debug backend survived restart"
    assert orig[0].poll() is None and sibling.poll() is None, "release or CLI server was terminated"
    assert release_bin.read_bytes() == release_hash, "release bundle executable changed"
    assert carrot(17891, 11, release_pid, release_backend) == release_child
    new_child = carrot(17892, 33, new_debug_pid, debug_backend)
    cleanup.callback(stop_child_if_owned, new_child, new_debug_pid, debug_backend)
    print("PASS: debug restart replaced only owned processes; release PID/socket/binary and standalone CLI preserved.", flush=True)
