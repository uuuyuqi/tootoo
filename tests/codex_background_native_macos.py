"""Smoke the actual release build using only a disposable Mach-O Codex fixture."""
from contextlib import ExitStack
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import os
import signal
import subprocess
import sys
import time

from agy_native_quota_macos import LaunchServicesApp, darwin, find_backend, next_quota_event, snapshot, stop_backend

FAKE_CODEX = r'''
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char **argv) {
  const char *home = getenv("HOME");
  if (!home || argc < 4 || strcmp(argv[argc-3],"app-server") ||
      strcmp(argv[argc-2],"--listen") || strcmp(argv[argc-1],"stdio://") ||
      getenv("OPENAI_API_KEY") || getenv("CODEX_API_KEY")) return 2;
  char path[4096], line[4096];
  if (snprintf(path,sizeof path,"%s/codex_rpc_calls",home) >= sizeof path) return 3;
  FILE *log=fopen(path,"a");
  if (!log) return 4;
  sleep(1);
  usleep(300000); /* Cold App Server startup/wakeup, before its first response. */
  if (!fgets(line,sizeof line,stdin) || !strstr(line,"\"method\":\"initialize\"")) return 5;
  fputs("initialize\n",log);
  puts("{\"id\":1,\"result\":{}}");
  fflush(stdout);
  if (!fgets(line,sizeof line,stdin) || !strstr(line,"\"method\":\"initialized\"")) return 6;
  fputs("initialized\n",log);
  if (!fgets(line,sizeof line,stdin) || !strstr(line,"\"method\":\"account/rateLimits/read\"")) return 7;
  fputs("account/rateLimits/read\n",log);
  fclose(log);
  if (snprintf(path,sizeof path,"%s/codex_probe_pid",home) >= sizeof path) return 8;
  log=fopen(path,"w");
  if (!log) return 9;
  fprintf(log,"%d\n",getpid());
  fclose(log);
  sleep(7);
  if (snprintf(path,sizeof path,"%s/codex_next_snapshot",home) >= sizeof path) return 10;
  int next = access(path, F_OK) == 0;
  printf("{\"id\":2,\"result\":{\"rateLimits\":{\"limitId\":\"codex\",\"primary\":null,\"secondary\":"
         "{\"usedPercent\":%d,\"windowDurationMins\":10080,\"resetsAt\":null}}}}\n",
         next ? 71 : strstr(home,"auto-zero") ? 0 : 5);
  fflush(stdout);
  return 0;
}
'''

def seed_codex(home, case):
    path = home / ".codex/sessions/synthetic.jsonl"
    path.parent.mkdir()
    ts = datetime.now(timezone.utc) - (timedelta(days=8) if case == "stale" else timedelta(seconds=1))
    entry = {
        "timestamp": ts.isoformat().replace("+00:00", "Z"),
        "type": "event_msg",
        "payload": {"type": "token_count", "info": {"last_token_usage": {"input_tokens": 20}}},
    }
    if case == "log":
        entry["payload"]["rate_limits"] = {"limit_id": "codex", "primary": {
            "used_percent": 25, "window_minutes": 10080, "resets_at": int(time.time()) + 3600}}
    elif case in ("auto-weekly", "auto-zero"):
        entry["payload"]["rate_limits"] = {"limit_id": "codex", "primary": {"used_percent": None}}
    path.write_text(json.dumps(entry) + "\n")


def install_fake(src, cleanup):
    # Hosted Intel Mac: explicitly exercise ARM Homebrew's real default discovery
    # path with a native Intel fixture. Never replace any preexisting app tool.
    installed = Path("/opt/homebrew/bin/codex")
    alternate = Path("/usr/local/bin/codex")
    assert not os.path.lexists(installed) and not os.path.lexists(alternate), "unexpected real CLI present"
    version_path = Path("/opt/homebrew/Caskroom/codex/fixture-tootoo-verify")
    target = version_path / "codex"
    assert not version_path.exists(), "refuse preexisting fixture Caskroom"
    for directory in (installed.parent, version_path):
        if not directory.exists():
            subprocess.run(["sudo", "install", "-d", "-g", "admin", "-m", "0775", str(directory)], check=True)
    subprocess.run(["sudo", "install", "-m", "0755", str(src), str(target)], check=True)
    subprocess.run(["sudo", "ln", "-s", str(target), str(installed)], check=True)
    def remove():
        assert installed.resolve(strict=True) == target and target.read_bytes() == src.read_bytes(), "fixture changed; refused to remove"
        subprocess.run(["sudo", "rm", str(installed), str(target)], check=True)
        subprocess.run(["sudo", "rmdir", str(version_path)], check=True)
    cleanup.callback(remove)


def install_npm_fake(src, cleanup):
    """Reproduce the npm-global architecture package via its literal symlink."""
    machine = os.uname().machine
    arch, triple, root = {
        "arm64": ("arm64", "aarch64-apple-darwin", Path("/opt/homebrew")),
        "x86_64": ("x64", "x86_64-apple-darwin", Path("/usr/local")),
    }[machine]
    launch = root / "bin/codex"
    modules = root / "lib/node_modules"
    package = modules / "@openai/codex"
    optional_name = "@openai/codex-darwin-" + arch
    optional = package / "node_modules" / optional_name
    wrapper = package / "bin/codex.js"
    target = optional / "vendor" / triple / "bin/codex"
    installed_version = "0.172.0"
    assert not os.path.lexists(launch) and not os.path.lexists(package), "unexpected real CLI present"

    def install_text(path, text, mode="0644"):
        with TemporaryDirectory(prefix="tootoo-npm-metadata-") as tmp:
            fixture = Path(tmp) / path.name
            fixture.write_text(text)
            subprocess.run(["sudo", "install", "-m", mode, str(fixture), str(path)], check=True)

    for directory in (launch.parent, wrapper.parent, target.parent):
        if not directory.exists():
            subprocess.run(["sudo", "install", "-d", "-g", "admin", "-m", "0775", str(directory)], check=True)
    install_text(package / "package.json", json.dumps({
        "name": "@openai/codex", "version": installed_version,
        "bin": {"codex": "bin/codex.js"},
        "optionalDependencies": {optional_name: f"npm:@openai/codex@{installed_version}-darwin-{arch}"},
    }))
    install_text(optional / "package.json", json.dumps({
        "name": "@openai/codex", "version": f"{installed_version}-darwin-{arch}",
        "os": ["darwin"], "cpu": [arch],
    }))
    install_text(wrapper, """#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.HOME + '/codex_wrapper_executed', 'unexpected');
process.exit(77);
""", "0755")
    subprocess.run(["sudo", "install", "-m", "0755", str(src), str(target)], check=True)
    subprocess.run(["sudo", "ln", "-s", "../lib/node_modules/@openai/codex/bin/codex.js", str(launch)], check=True)

    def remove():
        assert launch.resolve(strict=True) == wrapper and target.read_bytes() == src.read_bytes(), "fixture changed; refused to remove"
        subprocess.run(["sudo", "rm", str(launch)], check=True)
        subprocess.run(["sudo", "rm", "-r", str(package)], check=True)
    cleanup.callback(remove)
    return target


def main(app, launcher, npm=False):
    with TemporaryDirectory(prefix="tootoo-codex-release-") as tmp, ExitStack() as prefix:
        root = Path(tmp).resolve()
        source, fake = root / "fake.c", root / "codex"
        source.write_text(FAKE_CODEX)
        subprocess.run(["/usr/bin/clang", str(source), "-o", str(fake)], check=True, timeout=30)
        npm_native = install_npm_fake(fake, prefix) if npm else None
        if not npm:
            install_fake(fake, prefix)
        cases = ("auto-weekly", "auto-zero") if npm else (
            "unused", "stale", "other-profile", "off", "log", "auto-weekly", "auto-restart", "auto-zero", "cancel")
        for balance, case in enumerate(cases, 271 if npm else 261):
            with ExitStack() as cleanup:
                restart = case == "auto-restart"
                home = root / ("auto-weekly" if restart else case)
                state_dir = home / "state"
                if restart:
                    (home / "codex_next_snapshot").touch()
                else:
                    home.mkdir()
                    (home / ".codex").mkdir()
                    (home / "other-profile").mkdir()
                    state_dir.mkdir()
                    if case != "unused":
                        seed_codex(home, case)
                (state_dir / "carrot_state.json").write_text(json.dumps({"balance": balance}))
                pid = int(subprocess.check_output([str(launcher), str(app), str(home), str(state_dir),
                                                   "codex-" + case], text=True, timeout=25))
                process = LaunchServicesApp(pid)
                cleanup.callback(process.stop)
                child, port = find_backend(app, pid, balance)
                cleanup.callback(stop_backend, child, pid)
                started = time.monotonic()
                data = snapshot(port)
                status = data["quota_status"]["codex"]["state"]
                calls = home / "codex_rpc_calls"
                if restart:
                    cached = data["quotas"].get("codex")
                    assert status == "cached" and cached["secondary"]["used_percent"] == 5, (status, cached)
                    assert time.monotonic() - started < 4, "persisted Codex cache blocked on CLI"
                    msg, elapsed = next_quota_event(port, data["quota_version"])
                    assert msg["quotas"]["codex"]["secondary"]["used_percent"] == 71, msg["quota_status"]
                    expected = ["initialize", "initialized", "account/rateLimits/read"]
                    assert calls.read_text().splitlines() == expected * 2
                    print(f"PASS Codex packaged native cold cache + early SSE delivery ({elapsed:.2f}s)", flush=True)
                    continue
                if case in ("unused", "stale", "other-profile", "off", "log"):
                    assert not calls.exists(), (case, status)
                    if case == "log":
                        quota = data["quotas"]["codex"]
                        assert quota["source"] == "session_log" and quota["primary"]["used_percent"] == 25
                    else:
                        assert data["quotas"].get("codex") is None
                        assert status == ("disabled" if case == "off" else "inactive"), (case, status)
                    time.sleep(.3)
                    assert not calls.exists()
                else:
                    assert status in ("loading", "inactive", "disabled"), (case,status)
                    assert time.monotonic() - started < 4, "telemetry waits on subprocess"
                    marker = home / "codex_probe_pid"
                    deadline = time.monotonic() + 4
                    while not marker.exists() and time.monotonic() < deadline:
                        time.sleep(.05)
                    worker = int(marker.read_text())
                    assert darwin.table().get(worker) == (child, os.getuid())
                    if npm_native is not None:
                        assert darwin.path(worker) == os.fsencode(npm_native), "npm shim rather than native package"
                        assert not (home / "codex_wrapper_executed").exists(), "npm JS wrapper executed"
                    assert calls.read_text().splitlines() == ["initialize", "initialized", "account/rateLimits/read"]
                    if case == "cancel":
                        os.kill(child, signal.SIGTERM)
                        deadline = time.monotonic() + 2
                        while worker in darwin.table() and time.monotonic() < deadline:
                            time.sleep(.05)
                        assert worker not in darwin.table(), "Codex worker outlived backend"
                    else:
                        deadline = time.monotonic() + 21
                        last_status = None
                        while time.monotonic() < deadline:
                            data = snapshot(port)
                            status = data["quota_status"]["codex"]
                            if status != last_status:
                                print(f"{case}: {status} (elapsed {time.monotonic()-started:.2f}s)", flush=True)
                                last_status = status
                            if status["state"] in ("live", "cached", "no_data", "unavailable"):
                                break
                            time.sleep(.2)
                        q = data["quotas"].get("codex")
                        assert q is not None, (case, last_status, calls.read_text(), worker in darwin.table())

                        assert q["primary"] is None and q["secondary"]["window_minutes"] == 10080
                        assert q["secondary"]["used_percent"] == (0 if case == "auto-zero" else 5)
                        assert (q["source"],q["account_scope"]) == ("app_server","current_cli")
                        assert calls.read_text().splitlines() == ["initialize", "initialized", "account/rateLimits/read"]
                print(f"PASS Codex packaged LaunchServices {'npm-native' if npm else 'Homebrew'} {case}", flush=True)


if __name__ == "__main__":
    main(*(Path(arg).resolve() for arg in sys.argv[1:3]), npm="--npm" in sys.argv[3:])
