import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("stop_debug", ROOT / "macos/stop_debug.py")
stop_debug = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stop_debug)


class StateIsolationTests(unittest.TestCase):
    def test_scanner_pricing_and_server_isolate_own_state_not_tool_home(self):
        probe = """
import json
import os
from pathlib import Path
import scanner, pricing, server

root = Path(os.environ['HOME'])
target = root / 'workspace state'
assert scanner.HOME == str(root) == pricing.HOME
assert scanner.CACHE_DIR == pricing.TOOTOO_DIR == server.CACHE_DIR == str(target)
for module, attrs in [
  (scanner, ['CACHE_FILE','CONFIG_FILE','EVO_STATE_FILE','CARROT_STATE_FILE','AG_QUOTA_CACHE_FILE']),
  (pricing, ['REMOTE_CACHE_FILE','OVERRIDES_FILE','CONFIG_FILE']),
  (server, ['WEATHER_CACHE_FILE']),
]:
    for attr in attrs:
        assert Path(getattr(module, attr)).parent == target, attr
assert scanner.load_carrot_state()['balance'] == 52
assert pricing.load_overrides() == {}
assert pricing.load_remote_cache()['models'] == {}
scanner.save_carrot_state({'balance': 67})
assert (target / 'pricing_overrides.json').exists()
assert json.loads((target / 'carrot_state.json').read_text())['balance'] == 67
"""
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp)
            prod, debug = home / ".tootoo", home / "workspace state"
            prod.mkdir()
            debug.mkdir()
            real_files = {
                "carrot_state.json": '{"balance":314}',
                "pricing_overrides.json": '{"models":{"gpt-6":{"in":17}}}',
                "pricing_remote.json": '{"models":{"gpt-6":{"in":17}}}',
            }
            for path, body in real_files.items():
                (prod / path).write_text(body)
            (debug / "carrot_state.json").write_text('{"balance":52}')
            self.run_probe(home, "~/workspace state", probe)
            self.assertEqual({p.name: p.read_text() for p in prod.iterdir()}, real_files)

    def run_probe(self, home, tool_dir, probe):
        env = {**os.environ, "HOME": str(home), "PYTHONDONTWRITEBYTECODE": "1"}
        env.pop("TOOTOO_HOME", None)
        if tool_dir is not None:
            env["TOOTOO_HOME"] = tool_dir
        subprocess.run([sys.executable, "-c", probe], cwd=ROOT, env=env, check=True)

    def test_unset_or_empty_tootoo_home_preserves_original_default(self):
        with tempfile.TemporaryDirectory() as temp:
            for val in [None, ""]:
                self.run_probe(temp, val, """
import os, scanner, pricing, server
expected = os.path.join(os.environ["HOME"], ".tootoo")
assert scanner.CACHE_DIR == pricing.TOOTOO_DIR == server.CACHE_DIR == expected
""")


class RestartScopeTests(unittest.TestCase):
    class Fake:
        def __init__(self):
            self.debug = b"/a path/dist/TooToo-Debug.app/Contents/MacOS/TooToo-Debug"
            self.server = b"/a path/dist/TooToo-Debug.app/Contents/Resources/server.py"
            self.release = b"/Applications/TooToo.app/Contents/MacOS/TooToo"
            self.release_server = b"/Applications/TooToo.app/Contents/Resources/server.py"
            self.rows = {
                101: (1, 501, self.debug, None),
                102: (101, 501, b"python3", [b"python3", self.server, b"--port"]),
                103: (101, 501, b"python3", [b"python3", self.release_server]),
                104: (1, 501, self.release, None),
                105: (104, 501, b"python3", [b"python3", self.release_server]),
                106: (1, 501, b"python3", [b"python3", self.server]),
                107: (107, 501, b"/unrelated/TooToo-Debug", None),
                108: (101, 501, b"python3", [b"python3", self.server + b".backup"]),
                109: (1, 502, self.debug, None),
            }
            self.stopped = []
        def table(self):
            return {pid: (row[0], row[1]) for pid, row in self.rows.items()}
        def path(self, pid):
            return self.rows.get(pid, (None, None, None))[2]
        def argv(self, pid):
            return self.rows[pid][3]
        def stop(self, pid):
            self.stopped.append(pid)
            self.rows.pop(pid)

    def test_only_exact_debug_and_its_exact_owned_backend_are_stopped(self):
        fake = self.Fake()
        stop_debug.stop_debug(fake, {fake.debug: fake.server}, 501, terminate=fake.stop)
        self.assertEqual(fake.stopped, [102, 101])
        self.assertEqual(set(fake.rows), set(range(103, 110)))

    def test_reparented_child_not_signalled(self):
        fake = self.Fake()
        original = fake.table
        calls = 0
        def table():
            nonlocal calls
            calls += 1
            if calls == 4:
                fake.rows[102] = (1, *fake.rows[102][1:])
            return original()
        fake.table = table
        stop_debug.stop_debug(fake, {fake.debug: fake.server}, 501, terminate=fake.stop)
        self.assertEqual(fake.stopped, [101])
        self.assertIn(102, fake.rows)

    def test_unverifiable_live_child_fails_closed(self):
        fake = self.Fake()
        fake.rows[102] = (*fake.rows[102][:3], None)
        with self.assertRaisesRegex(RuntimeError, "Cannot verify Debug child"):
            stop_debug.stop_debug(fake, {fake.debug: fake.server}, 501, terminate=fake.stop)
        self.assertEqual(fake.stopped, [])

    def test_symlink_to_release_not_an_allowed_target(self):
        with tempfile.TemporaryDirectory() as temp:
            dist = Path(temp).resolve() / "dist"
            release = dist / "TooToo.app"
            release.mkdir(parents=True)
            (dist / "TooToo-Debug.app").symlink_to(release)
            self.assertFalse(any(os.fsencode(dist) in p for p in stop_debug.debug_paths(dist.parent)))


if __name__ == "__main__":
    unittest.main()
