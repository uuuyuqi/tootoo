#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
APP="$DIST/TooToo.app"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"
RES="$CONTENTS/Resources"
TOOTOO_DEBUG="${TOOTOO_DEBUG:-0}"

rm -rf "$APP"
mkdir -p "$MACOS" "$RES/ui"

echo "==> Generating TooToo bunny app icon..."
ICONSET="$DIST/AppIcon.iconset"
rm -rf "$ICONSET"
swift "$ROOT/macos/gen_icon.swift" "$ICONSET"
iconutil -c icns "$ICONSET" -o "$RES/TooToo.icns"
rm -rf "$ICONSET"

if [[ "$TOOTOO_DEBUG" == "1" ]]; then
  echo "==> Compiling native Swift macOS menu bar binary (DEBUG mode)..."
  swiftc -O -D TOOTOO_DEBUG \
    -framework AppKit \
    -framework WebKit \
    -framework Foundation \
    "$ROOT/macos/main.swift" \
    -o "$MACOS/TooToo"
else
  echo "==> Compiling native Swift macOS menu bar binary (RELEASE mode)..."
  swiftc -O \
    -framework AppKit \
    -framework WebKit \
    -framework Foundation \
    "$ROOT/macos/main.swift" \
    -o "$MACOS/TooToo"
fi

echo "==> Bundling scanner, pricing, server, and UI..."
cp "$ROOT/scanner.py" "$RES/scanner.py"
cp "$ROOT/pricing.py" "$RES/pricing.py"
cp "$ROOT/server.py" "$RES/server.py"
cp -R "$ROOT/ui/." "$RES/ui/"

if [[ "$TOOTOO_DEBUG" != "1" ]]; then
  echo "==> Stripping dev debug buttons, sandboxes, and shortcuts for release bundle (set TOOTOO_DEBUG=1 to keep)..."
  python3 - "$RES/ui/index.html" <<'PY'
import re
import sys
from pathlib import Path

p = Path(sys.argv[1])
text = p.read_text(encoding="utf-8")

text, n_html = re.subn(
    r"\s*<!--\s*TOOTOO_DEV_DEBUG_START\s*-->.*?<!--\s*TOOTOO_DEV_DEBUG_END\s*-->",
    "",
    text,
    flags=re.DOTALL,
)
text, n_js = re.subn(
    r"\s*/\*\s*TOOTOO_DEV_DEBUG_JS_START\s*\*/.*?/\*\s*TOOTOO_DEV_DEBUG_JS_END\s*\*/",
    "",
    text,
    flags=re.DOTALL,
)
flag_target = "/*__TOOTOO_DEBUG_FLAG__*/true"
n_flag = text.count(flag_target)
assert n_html == 5, f"Expected 5 HTML debug blocks, stripped {n_html}"
assert n_js == 3, f"Expected 3 JS debug blocks, stripped {n_js}"
assert n_flag == 1, f"Expected 1 debug flag marker, found {n_flag}"
text = text.replace(flag_target, "/*__TOOTOO_DEBUG_FLAG__*/false", 1)

forbidden = [
    'id="debugBar"',
    'id="dbgHomePanel"',
    'id="dbgGachaPanel"',
    'id="dbgBlGodBtn"',
    'id="dbgRainWaveBtn"',
    "TOOTOO_DEV_DEBUG_START",
    "TOOTOO_DEV_DEBUG_JS_START",
]
for token in forbidden:
    assert token not in text, f"Forbidden debug artifact leaked into release bundle: {token}"

p.write_text(text, encoding="utf-8")
print(f"    Stripped {n_html} HTML debug panels + {n_js} JS debug wiring blocks.")
PY
  touch "$RES/.release"
else
  echo "==> Keeping dev debug panels & shortcuts in bundle (TOOTOO_DEBUG=1)."
fi

cat > "$CONTENTS/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_CN</string>
    <key>CFBundleExecutable</key>
    <string>TooToo</string>
    <key>CFBundleIconFile</key>
    <string>TooToo</string>
    <key>CFBundleIdentifier</key>
    <string>com.tootoo.telemetry</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>TooToo</string>
    <key>CFBundleDisplayName</key>
    <string>TooToo</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>0.1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>
</dict>
</plist>
PLIST

echo "==> Ad-hoc code signing..."
codesign --force --deep --sign - "$APP"

echo "==> Installing to /Applications/TooToo.app..."
rm -rf /Applications/TooToo.app
cp -R "$APP" /Applications/TooToo.app

echo "✅ Built and installed /Applications/TooToo.app"
