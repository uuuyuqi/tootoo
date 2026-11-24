#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
VERSION="${VERSION:-$(cat "$ROOT/VERSION")}"
VERSION_CLEAN="${VERSION#v}"
BUILD_NUMBER="${BUILD_NUMBER:-11}"
TOOTOO_DEBUG="${TOOTOO_DEBUG:-0}"
NO_INSTALL="${NO_INSTALL:-0}"
PACKAGE_ZIP="${PACKAGE_ZIP:-0}"

if [[ "$TOOTOO_DEBUG" == "1" ]]; then
  APP_NAME="TooToo-Debug"
  BUNDLE_IDENTIFIER="com.tootoo.telemetry.debug"
  UNIVERSAL="${UNIVERSAL:-0}"
else
  APP_NAME="TooToo"
  BUNDLE_IDENTIFIER="com.tootoo.telemetry"
  UNIVERSAL="${UNIVERSAL:-1}"
fi
APP="$DIST/$APP_NAME.app"
INSTALL_APP="/Applications/$APP_NAME.app"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"
RES="$CONTENTS/Resources"

rm -rf "$APP"
mkdir -p "$MACOS" "$RES/ui"

echo "==> Generating TooToo bunny app icon..."
ICONSET="$DIST/AppIcon.iconset"
if [[ "$TOOTOO_DEBUG" == "1" ]]; then ICONSET="$DIST/TooToo-Debug.iconset"; fi
rm -rf "$ICONSET"
swift "$ROOT/macos/gen_icon.swift" "$ICONSET"
iconutil -c icns "$ICONSET" -o "$RES/TooToo.icns"
rm -rf "$ICONSET"

compile_slice() {
  local target="$1"
  local out="$2"
  if [[ "$TOOTOO_DEBUG" == "1" ]]; then
    swiftc -O -D TOOTOO_DEBUG \
      -target "$target" \
      -framework AppKit \
      -framework WebKit \
      -framework IOKit \
      -framework Foundation \
      "$ROOT/macos/main.swift" "$ROOT/macos/UpdateController.swift" "$ROOT/macos/PopoverLifecycle.swift" \
      -o "$out"
  else
    swiftc -O \
      -target "$target" \
      -framework AppKit \
      -framework WebKit \
      -framework IOKit \
      -framework Foundation \
      "$ROOT/macos/main.swift" "$ROOT/macos/UpdateController.swift" "$ROOT/macos/PopoverLifecycle.swift" \
      -o "$out"
  fi
}

MODE_LABEL="RELEASE"
[[ "$TOOTOO_DEBUG" == "1" ]] && MODE_LABEL="DEBUG"

if [[ "$UNIVERSAL" == "1" ]]; then
  echo "==> Compiling Universal (arm64 + x86_64) Swift macOS binary (${MODE_LABEL}, v${VERSION_CLEAN})..."
  compile_slice "arm64-apple-macos13.0" "$DIST/$APP_NAME-arm64"
  compile_slice "x86_64-apple-macos13.0" "$DIST/$APP_NAME-x86_64"
  lipo -create "$DIST/$APP_NAME-arm64" "$DIST/$APP_NAME-x86_64" -output "$MACOS/$APP_NAME"
  rm -f "$DIST/$APP_NAME-arm64" "$DIST/$APP_NAME-x86_64"
else
  HOST_ARCH="$(uname -m)"
  echo "==> Compiling native ${HOST_ARCH} Swift macOS binary (${MODE_LABEL}, v${VERSION_CLEAN})..."
  compile_slice "${HOST_ARCH}-apple-macos13.0" "$MACOS/$APP_NAME"
fi

echo "==> Bundling scanner, pricing, server, CLI, and UI..."
cp "$ROOT/scanner.py" "$RES/scanner.py"
cp "$ROOT/agy_cli_quota.py" "$RES/agy_cli_quota.py"
cp "$ROOT/codex_app_quota.py" "$RES/codex_app_quota.py"
cp "$ROOT/pricing.py" "$RES/pricing.py"
cp "$ROOT/server.py" "$RES/server.py"
cp "$ROOT/update_check.py" "$RES/update_check.py"
printf '%s\n' "$VERSION_CLEAN" > "$RES/VERSION"
if [[ "$TOOTOO_DEBUG" != "1" ]]; then
  cp "$ROOT/macos/update_install.py" "$RES/update_install.py"
fi
cp "$ROOT/tootoo" "$RES/tootoo"
chmod +x "$RES/tootoo"
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

cat > "$CONTENTS/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_CN</string>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIconFile</key>
    <string>TooToo</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_IDENTIFIER}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION_CLEAN}</string>
    <key>CFBundleVersion</key>
    <string>${BUILD_NUMBER}</string>
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

if [[ "$PACKAGE_ZIP" == "1" ]]; then
  ARCH_TAG="universal"
  [[ "$UNIVERSAL" != "1" ]] && ARCH_TAG="$(uname -m)"
  ZIP_PATH="$DIST/$APP_NAME-v${VERSION_CLEAN}-macos-${ARCH_TAG}.zip"
  rm -f "$ZIP_PATH"
  echo "==> Packaging release archive: $ZIP_PATH"
  ditto -c -k --sequesterRsrc --keepParent "$APP" "$ZIP_PATH"
  SHA256="$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')"
  echo "    SHA256: $SHA256"
  echo "$SHA256  $(basename "$ZIP_PATH")" > "${ZIP_PATH}.sha256"
fi

if [[ "$NO_INSTALL" != "1" ]]; then
  echo "==> Installing to $INSTALL_APP..."
  rm -rf "$INSTALL_APP"
  cp -R "$APP" "$INSTALL_APP"
  echo "✅ Built and installed $INSTALL_APP (v${VERSION_CLEAN})"
else
  echo "✅ Built $APP (v${VERSION_CLEAN})"
fi
