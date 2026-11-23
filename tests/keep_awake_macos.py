"""macOS-only smoke: assert kernel state for an actual TooToo app process."""
import os
import pathlib
import queue
import re
import signal
import subprocess
import sys
import threading
import time
import uuid

reason = "TooToo Keep Awake (AI Coding)"
suite = "org.tootoo.keep-awake-ci." + uuid.uuid4().hex
env = {**os.environ, "TOOTOO_KEEP_AWAKE_CI_SUITE": suite}
binary = pathlib.Path(sys.argv[1]).resolve()
assert binary.name == "TooToo", binary

def wait_for_kernel(pid, wanted, timeout=12):
    deadline = time.monotonic() + timeout
    while True:
        report = subprocess.check_output(["/usr/bin/pmset", "-g", "assertions"], text=True)
        owner = re.compile(r"^\s*pid " + str(pid) + r"\(TooToo\):", re.M)
        rows = [line.strip() for line in report.splitlines() if owner.match(line) and reason in line]
        actual = [m.group() for line in rows
                  if (m := re.search(r"PreventUserIdle(?:System|Display)Sleep", line))]
        if (wanted is None and not rows) or (len(rows) == 1 and actual == [wanted]):
            print(f"PID {pid}, expected {wanted or 'none'}: {rows}", flush=True)
            return
        if time.monotonic() > deadline:
            raise AssertionError(f"PID {pid}, expected {wanted}; observed {rows}\n{report}")
        time.sleep(0.15)

class App:
    def __enter__(self):
        self.p = subprocess.Popen([str(binary), "--keep-awake-ci"], env=env, text=True,
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=1)
        self.lines = queue.Queue()
        def copy_output():
            for line in self.p.stdout:
                print(line, end="", flush=True)
                self.lines.put(line.rstrip())
        threading.Thread(target=copy_output, daemon=True).start()
        self.expect("TOOTOO_KEEP_AWAKE_CI_READY")
        return self
    def expect(self, expected):
        message = self.lines.get(timeout=15)
        assert message == expected, (message, expected)
    def cmd(self, command, mode, preferred, duration):
        print(f"> {command}", flush=True)
        self.p.stdin.write(command + "\n")
        self.p.stdin.flush()
        self.expect(f"mode={mode} preferred={preferred} duration={duration}")
    def __exit__(self, *_):
        if self.p.poll() is None:
            self.p.kill()
        self.p.wait(timeout=15)
        self.p.stdin.close()
        self.p.stdout.close()

def main():
    system = "PreventUserIdleSystemSleep"
    display = "PreventUserIdleDisplaySleep"
    with App() as app:
        pid = app.p.pid
        app.cmd("state", "off", "system", 0)
        wait_for_kernel(pid, None)
        app.cmd("system 0", "system", "system", 0)
        wait_for_kernel(pid, system)
        app.cmd("display 0", "display", "display", 0)
        wait_for_kernel(pid, display)
        app.cmd("off 0", "off", "display", 0)
        wait_for_kernel(pid, None)
        app.cmd("system 60", "system", "system", 60)
        wait_for_kernel(pid, system)
        app.cmd("display 0", "display", "display", 0)
        time.sleep(5.3)
        wait_for_kernel(pid, display)
        app.cmd("system 120", "system", "system", 120)
        wait_for_kernel(pid, system)
        wait_for_kernel(pid, None)
        app.cmd("state", "off", "system", 120)
        app.cmd("display 480", "display", "display", 480)
        wait_for_kernel(pid, display)
        app.p.stdin.write("quit\n")
        app.p.stdin.flush()
        assert app.p.wait(timeout=15) == 0
        wait_for_kernel(pid, None)
    with App() as app:
        pid = app.p.pid
        app.cmd("state", "off", "display", 480)
        wait_for_kernel(pid, None)
        app.cmd("system 0", "system", "system", 0)
        wait_for_kernel(pid, system)
        app.p.send_signal(signal.SIGKILL)
        assert app.p.wait(timeout=15) == -signal.SIGKILL
        wait_for_kernel(pid, None)
    print("PASS: exact TooToo PID and reason; transitions, stale timer, timeout, quit, restart, SIGKILL")

try:
    main()
finally:
    subprocess.run(["/usr/bin/defaults", "delete", suite], check=False,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
