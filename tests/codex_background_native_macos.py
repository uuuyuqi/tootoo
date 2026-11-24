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

from agy_native_quota_macos import LaunchServicesApp, darwin, find_backend, snapshot, stop_backend

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
  printf("{\"id\":2,\"result\":{\"rateLimits\":{\"limitId\":\"codex\",\"primary\":null,\"secondary\":"
         "{\"usedPercent\":%d,\"windowDurationMins\":10080,\"resetsAt\":null}}}}\n",
         strstr(home,"auto-zero") ? 0 : 5);
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


def main(app, launcher):
    with TemporaryDirectory(prefix="tootoo-codex-release-") as tmp, ExitStack() as prefix:
        root = Path(tmp).resolve()
        source, fake = root / "fake.c", root / "codex"
        source.write_text(FAKE_CODEX)
        subprocess.run(["/usr/bin/clang", str(source), "-o", str(fake)], check=True, timeout=30)
        install_fake(fake, prefix)
        for balance, case in enumerate(("unused", "stale", "other-profile", "off", "log",
                                       "auto-weekly", "auto-zero", "cancel"), 261):
            with ExitStack() as cleanup:
                home = root / case
                home.mkdir()
                (home / ".codex").mkdir()
                (home / "other-profile").mkdir()
                state_dir = home / "state"
                state_dir.mkdir()
                (state_dir / "carrot_state.json").write_text(json.dumps({"balance": balance}))
                if case != "unused":
                    seed_codex(home, case)
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
                    assert calls.read_text().splitlines() == ["initialize", "initialized", "account/rateLimits/read"]
                    if case == "cancel":
                        os.kill(child, signal.SIGTERM)
                        deadline = time.monotonic() + 2
                        while worker in darwin.table() and time.monotonic() < deadline:
                            time.sleep(.05)
                        assert worker not in darwin.table(), "Codex worker outlived backend"
                    else:
                        deadline = time.monotonic() + 12
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
                print(f"PASS Codex packaged LaunchServices {case}", flush=True)


if __name__ == "__main__":
    main(*(Path(arg).resolve() for arg in sys.argv[1:3]))
