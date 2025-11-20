#!/bin/bash

# Script to sign and package the Trader Browser Block app for macOS

set -e

echo "Signing Trader Browser Block for macOS..."

cd "$(dirname "$0")"

# Build the app first
echo "Building app..."
cd packages/app
npm run build
cd ../..

# Sign ARM64 version
echo "Signing ARM64 version..."
cd dist/mac-arm64
xattr -cr "Trader Browser Block.app"

# Sign all frameworks and libraries
find "Trader Browser Block.app/Contents/Frameworks" \( -name "*.framework" -o -name "*.dylib" \) | while read f; do
    codesign --force --deep --sign - --entitlements ../../entitlements.plist "$f" 2>/dev/null || true
done

# Sign the main app
codesign --force --deep --sign - --entitlements ../../entitlements.plist "Trader Browser Block.app"

# Create signed zip
cd ..
rm -f "Trader Browser Block-1.0.0-arm64-signed.zip"
ditto -c -k --keepParent "mac-arm64/Trader Browser Block.app" "Trader Browser Block-1.0.0-arm64-signed.zip"

# Sign Intel version
echo "Signing Intel (x64) version..."
cd mac
xattr -cr "Trader Browser Block.app"

# Sign all frameworks and libraries
find "Trader Browser Block.app/Contents/Frameworks" \( -name "*.framework" -o -name "*.dylib" \) | while read f; do
    codesign --force --deep --sign - --entitlements ../../entitlements.plist "$f" 2>/dev/null || true
done

# Sign the main app
codesign --force --deep --sign - --entitlements ../../entitlements.plist "Trader Browser Block.app"

# Create signed zip
cd ..
rm -f "Trader Browser Block-1.0.0-intel-signed.zip"
ditto -c -k --keepParent "mac/Trader Browser Block.app" "Trader Browser Block-1.0.0-intel-signed.zip"

echo ""
echo "✅ Signed packages created:"
echo "   - dist/Trader Browser Block-1.0.0-arm64-signed.zip (Apple Silicon)"
echo "   - dist/Trader Browser Block-1.0.0-intel-signed.zip (Intel)"
echo ""
echo "To install:"
echo "1. Extract the zip file"
echo "2. Drag 'Trader Browser Block.app' to /Applications"
echo "3. Right-click the app and select 'Open' (first time only)"
echo "4. Click 'Open' when prompted about unsigned developer"

