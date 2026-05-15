# Update / Rebuild TiltBlocker

After editing any Swift file in `Sources/TiltBlocker/`.

## Quick path (if installed at `/Applications/TiltBlocker.app`)

```bash
cd /path/to/TiltBlocker

# 1. Quit the running app (menu bar icon → Quit)
osascript -e 'tell application "TiltBlocker" to quit'

# 2. Rebuild
./build-app.sh

# 3. Replace the installed copy
rm -rf /Applications/TiltBlocker.app
mv build/TiltBlocker.app /Applications/

# 4. Relaunch
open /Applications/TiltBlocker.app
```

One-liner version:

```bash
cd /path/to/TiltBlocker && \
  osascript -e 'tell application "TiltBlocker" to quit' 2>/dev/null; \
  ./build-app.sh && \
  rm -rf /Applications/TiltBlocker.app && \
  mv build/TiltBlocker.app /Applications/ && \
  open /Applications/TiltBlocker.app
```

## Dev path (running from repo, not installed)

For fast iteration during code changes:

```bash
cd /path/to/TiltBlocker

# Quit any running copy
osascript -e 'tell application "TiltBlocker" to quit' 2>/dev/null

# Rebuild + run in place
./build-app.sh
open build/TiltBlocker.app
```

The build is incremental — only changed files recompile (~1–3 seconds typically).

## What persists across updates

These survive rebuilds — you do **not** lose your setup:

| Data | Location |
|---|---|
| Partner email, Resend API key, From address | macOS Keychain (`com.tiltblocker.local`) |
| Blocklist | `~/.tiltblocker/blocklist.txt` |
| Schedule | `~/.tiltblocker/schedule.json` |
| Active lockout state | `~/.tiltblocker/state.json` |

Rebuilding only replaces the executable. You won't be asked to re-run setup unless you've manually wiped Keychain.

## Forcing a clean rebuild

If something is misbehaving and you suspect stale build artifacts:

```bash
cd /path/to/TiltBlocker
rm -rf .build build
./build-app.sh
```

## Resetting the app entirely

To start over from scratch (re-run setup, lose config):

```bash
# Quit app
osascript -e 'tell application "TiltBlocker" to quit' 2>/dev/null

# Wipe config files
rm -rf ~/.tiltblocker

# Wipe Keychain entries (each prompts for your Mac login password)
security delete-generic-password -s com.tiltblocker.local -a partner_email
security delete-generic-password -s com.tiltblocker.local -a resend_api_key
security delete-generic-password -s com.tiltblocker.local -a resend_from

# Rebuild + run
./build-app.sh
open build/TiltBlocker.app
```

## If a lockout is stuck

If the app crashes or you delete it mid-lockout, `/etc/hosts` may still have TiltBlocker entries blocking sites. To remove them manually:

```bash
sudo sed -i '' '/# === TILTBLOCKER START ===/,/# === TILTBLOCKER END ===/d' /etc/hosts
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

## Troubleshooting

**"Build failed" with cryptic Swift errors**
- Try a clean rebuild (see above)
- Confirm `swift --version` shows ≥ 5.9 and Xcode ≥ 14
- If `swift` points to Command Line Tools, run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

**Menu bar icon doesn't appear after launch**
- Check `ps aux | grep TiltBlocker` — is the process actually running?
- If your menu bar is crowded, the icon may be hidden behind the notch on a MacBook with a notch — try **Bartender** or move other items
- Try `killall TiltBlocker` then `open /Applications/TiltBlocker.app`

**"Cannot change partner during an active lockout"**
- That's intentional. Wait for the lockout to end (or override it), then change.

**Resend emails not arriving**
- Check spam folder
- Verify the API key is still active in Resend dashboard
- Confirm the from address — if you set a custom domain, it must be verified in Resend
- Check Resend dashboard → **Logs** for delivery status
