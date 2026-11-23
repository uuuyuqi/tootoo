"""Test the official ZIP and native updater in an isolated macOS runner."""
import hashlib
import json
from pathlib import Path
import os
import plistlib
import queue
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "macos"))
import update_install as updater

CONTROL_C = r"""
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

int main(int argc, char **argv) {
    if (argc != 8 || strcmp(argv[1], "--fixture-control") != 0) {
#ifdef EXIT_EARLY
        return 42;
#else
        for (;;) pause();
#endif
    }
    char pid[32], line[8192];
    snprintf(pid, sizeof(pid), "%d", getpid());
    while (fgets(line, sizeof(line), stdin)) {
        line[strcspn(line, "\r\n")] = 0;
        if (!strcmp(line, "quit")) return 0;
        int stage = !strcmp(line, "stage");
        if (!stage && strncmp(line, "install ", 8)) return 2;
        char *stage_args[] = {argv[2], "-I", argv[3], "stage", "--parent", pid,
            "--bundle", argv[4], "--version", argv[5], "--zip-url", argv[6],
            "--checksum-url", argv[7], NULL};
        char *install_args[] = {argv[2], "-I", argv[3], "install", "--parent", pid,
            "--bundle", argv[4], "--staged", &line[8], NULL};
        pid_t child = fork();
        if (child < 0) return 3;
        if (child == 0) {
            execv(argv[2], stage ? stage_args : install_args);
            _exit(127);
        }
        if (stage) {
            while (waitpid(child, NULL, 0) < 0 && errno == EINTR) {}
        }
    }
    return 0;
}
"""


def sign(app):
    subprocess.run(["/usr/bin/codesign", "--force", "--deep", "--sign", "-", str(app)], check=True)


def build_fixtures(workspace):
    c = workspace / "control.c"
    c.write_text(CONTROL_C)
    binaries = []
    for crash in (False, True):
        binary = workspace / ("crashing-fixture" if crash else "running-fixture")
        cmd = ["/usr/bin/clang", "-O2", "-arch", "arm64", "-arch", "x86_64",
               "-mmacosx-version-min=13.0"]
        if crash:
            cmd.append("-DEXIT_EARLY")
        subprocess.run([*cmd, str(c), "-o", str(binary)], check=True)
        binaries.append(binary)
    return binaries


def build_app(folder, executable, version):
    app = folder / updater.APP
    resources = app / updater.RESOURCES
    resources.mkdir(parents=True)
    (app / updater.EXECUTABLE).parent.mkdir()
    shutil.copy2(executable, app / updater.EXECUTABLE)
    (app / updater.PLIST).write_bytes(plistlib.dumps({
        "CFBundleIdentifier": updater.IDENTIFIER,
        "CFBundleExecutable": "TooToo", "CFBundlePackageType": "APPL",
        "CFBundleShortVersionString": version, "CFBundleVersion": version,
        "LSMinimumSystemVersion": "13.0", "LSUIElement": True,
    }))
    (resources / ".release").touch()
    return app


def install_fixture_script(old_app, zip_url, checksum_url, archive, checksum):
    source = (ROOT / "macos/update_install.py").read_text()
    assert source.count('if __name__ == "__main__":') == 1
    fixtures = f"""
def download_file(url, destination, limit, progress=lambda _: None):
    local = {{{zip_url!r}: {str(archive)!r}, {checksum_url!r}: {str(checksum)!r}}}[url]
    contents = Path(local).read_bytes()
    if len(contents) > limit:
        raise UpdateError("fixture too large")
    destination.write_bytes(contents)
    progress(1.0)

def failure_ledger(bundle, version, error):
    write_json(bundle.parent / "fixture-error.json", {{"version": version, "error": error}})
"""
    path = old_app / updater.RESOURCES / "update_install.py"
    path.write_text(source.replace('if __name__ == "__main__":', fixtures + '\nif __name__ == "__main__":'))
    return path


def wait_for(predicate, desc, timeout=25):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        if predicate():
            return
        time.sleep(0.1)
    raise AssertionError(f"Timed out waiting for {desc}")


def exercise(workspace, healthy_binary, candidate_binary, mode):
    name, zip_url, checksum_url = updater.release_asset_urls("0.2.4")
    next_app = build_app(workspace / "candidate", candidate_binary, "0.2.4")
    sign(next_app)
    if mode == "unsigned-plist":
        info = plistlib.loads((next_app / updater.PLIST).read_bytes())
        info["CFBundleDisplayName"] = "Modified after signing"
        (next_app / updater.PLIST).write_bytes(plistlib.dumps(info))
    archive = workspace / name
    subprocess.run(["/usr/bin/ditto", "-c", "-k", "--sequesterRsrc", "--keepParent",
                    str(next_app), str(archive)], check=True)
    checksum = workspace / f"{name}.sha256"
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    if mode == "wrong-sha":
        digest = "0" * 64
    checksum.write_text(f"{digest}  {name}\n")
    old_app = build_app(workspace / "installed", healthy_binary, "0.2.3")
    old_handoff = install_fixture_script(old_app, zip_url, checksum_url, archive, checksum)
    sign(old_app)
    original_identity = updater.identity(old_app)
    original_executable = old_app / updater.EXECUTABLE
    data = workspace / "fake-home/.tootoo"
    data.mkdir(parents=True)
    sentinel = data / "untouched"
    sentinel.write_text("original user data")
    p = subprocess.Popen(
        [original_executable, "--fixture-control", sys.executable, old_handoff,
         old_app, "0.2.4", zip_url, checksum_url],
        text=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=1,
        env={**os.environ, "HOME": str(data.parent), "TOOTOO_HOME": str(data)},
    )
    messages = queue.Queue()

    def copy_output():
        for line in p.stdout:
            print(f"{mode}: {line.rstrip()}", flush=True)
            messages.put(json.loads(line))

    thread = threading.Thread(target=copy_output, daemon=True)
    thread.start()

    def command(text):
        p.stdin.write(text + "\n")
        p.stdin.flush()

    def status(*names):
        end = time.monotonic() + 35
        while True:
            item = messages.get(timeout=max(0, end - time.monotonic()))
            if item["status"] in set(names) | {"error"}:
                return item

    try:
        command("stage")
        message = status("staged")
        if mode in ("wrong-sha", "unsigned-plist"):
            assert message["status"] == "error", message
            assert ("SHA-256 mismatch" if mode == "wrong-sha" else "signature") in message["error"], message
            wait_for(lambda: not list(old_app.parent.glob(updater.STAGE_PREFIX + "*")), "staging cleanup")
            assert p.poll() is None and updater.identity(old_app) == original_identity
        else:
            assert message["status"] == "staged", message
            stage = Path(message["stagingPath"])
            command(f"install {stage}")
            ready = status("ready")
            assert ready["status"] == "ready", ready
            assert updater.identity(old_app) == original_identity, "app was touched before parent exit"
            command("quit")
            assert p.wait(timeout=10) == 0
            wait_for(lambda: not stage.exists(), "verified relaunch and staging cleanup", timeout=55)
            assert updater.pids_for(original_executable), "updated/restored app did not stay running"
            if mode == "rollback":
                assert updater.identity(old_app) == original_identity
                message = json.loads((old_app.parent / "fixture-error.json").read_bytes())
                assert "previous version was restored" in message["error"], message
                assert updater.bundle_version(old_app) == "0.2.3"
            else:
                assert updater.identity(old_app) != original_identity
                assert updater.bundle_version(old_app) == "0.2.4"
        assert sentinel.read_text() == "original user data"
        assert list(data.iterdir()) == [sentinel]
        print(f"PASS native updater: {mode}", flush=True)
    finally:
        if p.poll() is None:
            p.terminate()
        p.wait(timeout=10)
        p.stdin.close()
        thread.join(timeout=5)
        p.stdout.close()
        for pid in updater.pids_for(original_executable):
            try:
                if updater.proc_path(pid) == str(original_executable):
                    os.kill(pid, signal.SIGTERM)
            except ProcessLookupError:
                pass


def smoke(archive, checksum):
    assert sys.platform == "darwin" and os.getuid() != 0
    filename = updater.release_asset_urls("0.2.4")[0]
    with tempfile.TemporaryDirectory(prefix="tootoo-updater-") as tmp:
        workspace = Path(tmp).resolve()
        built = workspace / "official-package"
        built.mkdir()
        expected = updater.parse_checksum(checksum.read_bytes(), filename)
        updater.verify_sha256(archive, expected)
        candidate = updater.extract_release(archive, built)
        updater.verify_candidate(candidate, "0.2.4")
        print("PASS native updater validates exact official ZIP, version, both architectures and signature", flush=True)
        healthy, crashing = build_fixtures(workspace)
        # Capture target and old/app PID independently; no repository or installed bundle is changed.
        for mode, executable in (
            ("wrong-sha", healthy), ("unsigned-plist", healthy),
            ("success", healthy), ("rollback", crashing),
        ):
            exercise(workspace / mode, healthy, executable, mode)


if __name__ == "__main__":
    smoke(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
