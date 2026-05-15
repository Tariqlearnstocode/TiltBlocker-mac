# Install TiltBlocker

First-time install. After this, see [HOW-TO-UPDATE.md](HOW-TO-UPDATE.md) for rebuilds.

## 1. Prerequisites

- macOS 13 or later
- Xcode (full, from App Store — Command Line Tools alone won't work for SwiftUI app builds)
- A Resend account: https://resend.com (free tier = 100 emails/day)

Check Xcode is set up:

```bash
xcodebuild -version
swift --version
```

If `swift --version` fails, run:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## 2. Get a Resend API key

1. Sign up at https://resend.com
2. Dashboard → **API Keys** → **Create API Key** → copy the `re_...` value
3. Keep it handy — you'll paste it into the setup screen below

You do **not** need to verify a domain to start. The default `onboarding@resend.dev` sender works out of the box (with rate limits and a "via resend.dev" tag in the email).

## 3. Build the app

```bash
cd /path/to/TiltBlocker
./build-app.sh
```

Output:

```
build/TiltBlocker.app
```

The script:
- Compiles `swift build -c release`
- Wraps the binary in a proper `.app` bundle with `LSUIElement=true` (no Dock icon)
- Ad-hoc code-signs it so Gatekeeper lets it run locally

## 4. Install to /Applications

```bash
mv build/TiltBlocker.app /Applications/
open /Applications/TiltBlocker.app
```

Note: don't run `./build-app.sh` again from inside `/path/to/TiltBlocker/` once you've moved the bundle — the next build will recreate it at `build/TiltBlocker.app` and you'd be running an out-of-date copy from `/Applications/`. See [HOW-TO-UPDATE.md](HOW-TO-UPDATE.md).

### First-time Gatekeeper prompt

If macOS says "TiltBlocker can't be opened because it's from an unidentified developer":

1. Open **System Settings → Privacy & Security**
2. Scroll to the bottom — you'll see "TiltBlocker was blocked..."
3. Click **Open Anyway**

Or, in Finder: right-click `TiltBlocker.app` → **Open** → confirm in the dialog. This is a one-time approval.

## 5. Launch at login

So TiltBlocker is always running:

1. **System Settings → General → Login Items & Extensions**
2. Under **Open at Login**, click **+**
3. Pick `/Applications/TiltBlocker.app`

## 6. First-run setup in the app

1. Look for the 🔓 (open lock) icon in the top-right of your menu bar
2. Click it → setup form appears in the popover
3. Fill in:
   - **Partner email** — the address codes will be sent to
   - **Resend API key** — paste the `re_...` value from step 2
   - **From address** — leave default (`TiltBlocker <onboarding@resend.dev>`) unless you've verified your own domain in Resend
4. Click **Save & email partner**
5. The app sends your partner a welcome email explaining the app and their role
6. On success, the setup form disappears and you're set

If the email fails (bad key, network), credentials are **not** saved — fix the issue and retry.

## 7. Configure blocklist + schedule

Edit two files in `~/.tiltblocker/`:

`blocklist.txt` — one domain per line:

```
tradingview.com
robinhood.com
webull.com
```

`schedule.json` — recurring lockout windows (24-hour times):

```json
{
  "windows": [
    {"days": ["mon","tue","wed","thu","fri"], "start": "09:30", "end": "16:00"}
  ]
}
```

Click the menu bar icon → refresh icon (top-right of popover) to reload.

## 8. Verify

- Menu bar icon is visible
- Click → popover shows blocklist + duration picker
- During a scheduled window, the icon switches to 🔒 and your blocked sites resolve to `0.0.0.0` in any browser
- First lockout will trigger a macOS admin password prompt (the app needs root to edit `/etc/hosts`)

If anything's broken, see [HOW-TO-UPDATE.md](HOW-TO-UPDATE.md) for rebuilding from scratch.
