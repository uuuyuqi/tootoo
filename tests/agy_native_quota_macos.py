"""Inspect owned backend of the archived app opened via LaunchServices, no real AGY."""
from contextlib import ExitStack, closing
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import os
import signal
import sqlite3
import subprocess
import sys
import time

from codex_native_quota_macos import darwin, find_backend, stop_backend, snapshot

FAKE_AGY = r'''
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(int argc, char **argv) {
  const char *home = getenv("HOME");
  if (!home) return 5;
  char file[4096];
  if (snprintf(file,sizeof file,"%s/agy_invocations",home) >= sizeof file) return 6;
  FILE *log = fopen(file,"a");
  if (!log) return 7;
  int version = argc == 2 && !strcmp(argv[1],"--version");
  int usage = argc == 5 && !strcmp(argv[1],"-p") && !strcmp(argv[2],"/usage")
      && !strcmp(argv[3],"--output-format") && !strcmp(argv[4],"json");
  fprintf(log,"%s\n", version ? "version" : usage ? "usage" : "unexpected");
  fclose(log);
  if (version) puts("1.1.11");
  else if (usage) puts("{\"status\":\"SUCCESS\",\"num_turns\":0,\"command\":{\"name\":\"usage\",\"data\":{\"groups\":["
    "{\"name\":\"Gemini Models\",\"buckets\":[{\"id\":\"gemini-5h\",\"window\":\"5h\",\"remaining_fraction\":0.75}]},"
    "{\"name\":\"Claude and GPT models\",\"buckets\":[{\"id\":\"3p-weekly\",\"window\":\"weekly\",\"remaining_fraction\":0.0}]},"
    "{\"name\":\"Gemini 4 Argon\",\"buckets\":[{\"id\":\"gemini-argon-wtu-weekly\",\"window\":\"weekly\",\"remaining_fraction\":0.42}]}]}}}");
  else return 99;
  return 0;
}
'''

class LaunchServicesApp:
    def __init__(self, pid):
        self.pid = pid

    def poll(self):
        return None if self.pid in darwin.table() else 1

    def stop(self):
        if self.poll() is None:
            try:
                os.kill(self.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass


def varint(n):
    buf = bytearray()
    while n > 127:
        buf.append((n & 127) | 128)
        n >>= 7
    buf.append(n)
    return bytes(buf)


def seed_activity(home):
    db = home / ".gemini/antigravity-cli/conversations/synthetic.db"
    db.parent.mkdir(parents=True)
    # gen_metadata field 1 -> generation record, field 4 -> nonzero input
    # token count, field 9 -> timing containing real Unix seconds.
    ts = b"\x08" + varint(int(time.time()) - 1)
    record = b"\x22\x02\x10\x01" + bytes([0x4A, len(ts) + 2, 0x22, len(ts)]) + ts
    entry = bytes([0x0A, len(record)]) + record
    with closing(sqlite3.connect(db)) as con, con:
        con.execute("CREATE TABLE gen_metadata(idx integer, data blob)")
        con.execute("INSERT INTO gen_metadata VALUES (1, ?)", (entry,))


def main(app, launcher):
    with TemporaryDirectory(prefix="tootoo-agy-launchservices-") as tmp:
        root = Path(tmp).resolve()
        src = root / "fake.c"
        src.write_text(FAKE_AGY)
        fake = root / "agy"
        subprocess.run(["/usr/bin/clang", str(src), "-o", str(fake)], check=True, timeout=30)
        for balance, case in enumerate(("inactive", "off", "auto"), 231):
            with ExitStack() as cleanup:
                home = root / case
                (home / ".local/bin").mkdir(parents=True)
                (home / ".codex").mkdir()
                (home / "state").mkdir()
                (home / "state/carrot_state.json").write_text(json.dumps({"balance": balance}))
                installed = home / ".local/bin/agy"
                installed.write_bytes(fake.read_bytes())
                installed.chmod(0o700)
                if case != "inactive":
                    seed_activity(home)
                pid = int(subprocess.check_output([str(launcher), str(app), str(home),
                                                   str(home / "state"), case], text=True, timeout=25))
                process = LaunchServicesApp(pid)
                cleanup.callback(process.stop)
                child, port = find_backend(process, balance)
                cleanup.callback(stop_backend, child, pid)
                data = snapshot(port)
                state = data["quota_status"]["antigravity"]
                quota = data["quotas"].get("antigravity")
                activity = any(x["tool"] == "antigravity" for x in data["tools"])
                assert activity == (case != "inactive"), (activity, case)
                log = home / "agy_invocations"
                if case == "auto":
                    assert state["state"] in ("live", "cached") and state["selected_source"] == "cli", state
                    assert quota["source"] in ("cli", "cli_cached")
                    assert {b["id"]: b["remaining_fraction"] for b in quota["buckets"]} == {
                        "gemini_5h": .75, "cg_7d": 0.0, "argon_7d": .42}
                    assert log.read_text().splitlines() == ["version", "usage"]
                else:
                    assert not log.exists() and quota is None, (case, state, quota)
                    if case == "off":
                        assert state["state"] == "disabled", state
                print(f"PASS packaged LaunchServices {case}: {state['state']}", flush=True)


if __name__ == "__main__":
    main(*(Path(arg).resolve() for arg in sys.argv[1:3]))
