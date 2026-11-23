#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
python3 "$ROOT/macos/stop_debug.py"
TOOTOO_DEBUG=1 bash "$ROOT/macos/build_app.sh"

if [[ "${NO_INSTALL:-0}" == "1" ]]; then
  APP="$ROOT/dist/TooToo-Debug.app"
else
  APP="/Applications/TooToo-Debug.app"
fi
# Launch the bundle's executable with the caller's environment. This preserves
# TOOTOO_HOME overrides without publishing environment variables to LaunchServices.
echo "==> Starting $APP"
nohup "$APP/Contents/MacOS/TooToo-Debug" </dev/null >/dev/null 2>&1 &
echo "✅ TooToo-Debug launched (PID $!)"
