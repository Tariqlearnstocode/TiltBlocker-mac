# macOS Installation Guide

## Known Issue: App Crashes on macOS 15+ (Sequoia)

The built app may crash immediately on macOS 15 (Sequoia) or later due to a compatibility issue between Electron 28 and the macOS Network framework. This affects the pre-built DMG files.

## Workaround Options

### Option 1: Run from Source (Recommended)

This is the most reliable method:

```bash
# 1. Install dependencies
npm install

# 2. Build the core package
cd packages/core && npm run build && cd ../..

# 3. Run in development mode
cd packages/app && npm run electron:dev
```

The app will open and run without issues when launched from the development environment.

### Option 2: Use Signed Packages

If you need a standalone app, use the signed zip files:

1. Extract `Trader Browser Block-1.0.0-arm64-signed.zip` (for Apple Silicon) or `Trader Browser Block-1.0.0-intel-signed.zip` (for Intel)

2. Move the app to Applications:
   ```bash
   mv "Trader Browser Block.app" /Applications/
   ```

3. Remove quarantine attribute:
   ```bash
   xattr -cr "/Applications/Trader Browser Block.app"
   ```

4. Right-click the app and select "Open" (first time only)

5. Click "Open" when prompted about the unsigned developer

**Note:** If it still crashes, use Option 1 instead.

### Option 3: Rebuild with Signing

Run the included script to rebuild and sign:

```bash
./sign-and-package.sh
```

## Technical Details

The crash occurs in the NetworkConfigWatcher thread when calling `SCNetworkReachabilityGetFlags`. This is a known issue with:
- Electron 28.0.0
- macOS 15+ (Sequoia and later)
- Unsigned or ad-hoc signed applications

The development version works because it runs with different security contexts.

## Future Fix

A proper fix would require either:
1. Upgrading to a newer version of Electron
2. Obtaining a valid Apple Developer certificate for code signing
3. Disabling network reachability checks in the Electron app

For now, running from source (Option 1) is the recommended approach.

