#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
APP="$DIST/TooToo.app"
CONTENTS="$APP/Contents"
MACOS="$CONTENTS/MacOS"
RES="$CONTENTS/Resources"

rm -rf "$APP"
mkdir -p "$MACOS" "$RES/ui"

echo "==> Generating TooToo bunny app icon..."
ICONSET="$DIST/AppIcon.iconset"
rm -rf "$ICONSET"
swift "$ROOT/macos/gen_icon.swift" "$ICONSET"
iconutil -c icns "$ICONSET" -o "$RES/TooToo.icns"
rm -rf "$ICONSET"

echo "==> Compiling native Swift macOS menu bar binary..."
swiftc -O \
  -framework AppKit \
  -framework WebKit \
  -framework Foundation \
  "$ROOT/macos/main.swift" \
  -o "$MACOS/TooToo"

echo "==> Bundling scanner, pricing, server, and UI..."
cp "$ROOT/scanner.py" "$RES/scanner.py"
cp "$ROOT/pricing.py" "$RES/pricing.py"
cp "$ROOT/server.py" "$RES/server.py"
cp -R "$ROOT/ui/." "$RES/ui/"

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
