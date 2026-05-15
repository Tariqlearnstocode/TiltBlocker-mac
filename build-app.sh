#!/usr/bin/env bash
set -euo pipefail

# Builds TiltBlocker.app — a proper macOS app bundle from the SwiftPM binary.
# Run: ./build-app.sh
# Output: build/TiltBlocker.app

ROOT="$(cd "$(dirname "$0")" && pwd)"
BIN_NAME="TiltBlocker"
APP_DIR="$ROOT/build/$BIN_NAME.app"

echo "==> Building release binary..."
swift build -c release

BIN_SRC="${ROOT}/.build/release/${BIN_NAME}"
if [ ! -f "${BIN_SRC}" ]; then
    echo "Build did not produce ${BIN_SRC}" >&2
    exit 1
fi

echo "==> Assembling ${APP_DIR}..."
rm -rf "${APP_DIR}"
mkdir -p "${APP_DIR}/Contents/MacOS"
mkdir -p "${APP_DIR}/Contents/Resources"

cp "${BIN_SRC}" "${APP_DIR}/Contents/MacOS/${BIN_NAME}"

cat > "$APP_DIR/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key><string>$BIN_NAME</string>
    <key>CFBundleIdentifier</key><string>com.tiltblocker.local</string>
    <key>CFBundleName</key><string>TiltBlocker</string>
    <key>CFBundlePackageType</key><string>APPL</string>
    <key>CFBundleShortVersionString</key><string>1.0</string>
    <key>CFBundleVersion</key><string>1</string>
    <key>LSMinimumSystemVersion</key><string>13.0</string>
    <key>LSUIElement</key><true/>
    <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
EOF

# Ad-hoc sign so Gatekeeper lets it run locally
codesign --force --deep --sign - "$APP_DIR" >/dev/null

echo "==> Built ${APP_DIR}"
echo "Open with: open '${APP_DIR}'"
echo "Move to /Applications to install permanently."
