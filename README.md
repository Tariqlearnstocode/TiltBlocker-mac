# TiltBlocker

A macOS menu bar app that locks me out of trading sites on a schedule (or on demand). To break a lockout early, I have to hit Emergency Override — which emails a fresh one-time code to my accountability partner via Resend. I then have to text them and ask for the code. No password lives anywhere persistent; each emergency is its own round-trip.

Lives in the menu bar like Proton VPN. No Dock icon, no window.

## Stack

- Swift 5.9+ / SwiftUI `MenuBarExtra`
- macOS 13+
- Plain text/JSON config in `~/.tiltblocker/`
- Hosts-file blocking via a single `osascript` admin prompt (no daemon)
- Keychain for the password hash + Resend credentials

## Build & install

See **[HOW-TO-INSTALL.md](HOW-TO-INSTALL.md)** for first-time setup (prereqs, Resend signup, Gatekeeper, Login Items).
See **[HOW-TO-UPDATE.md](HOW-TO-UPDATE.md)** for rebuilding after code changes.

TL;DR:

```bash
./build-app.sh
open build/TiltBlocker.app             # try it
mv build/TiltBlocker.app /Applications # install permanently
```

Then add it to **System Settings → General → Login Items** so it starts on boot.

## First run

Click the menu bar icon. You'll see a setup form asking for:
- Partner email
- Resend API key (`re_…`)
- From address (default works with Resend's onboarding sender)

The app just stores these in Keychain. Nothing is emailed yet.

## Config files (`~/.tiltblocker/`)

`blocklist.txt` — one domain per line:
```
tradingview.com
robinhood.com
webull.com
```

`schedule.json` — recurring lockout windows:
```json
{
  "windows": [
    {"days": ["mon","tue","wed","thu","fri"], "start": "09:30", "end": "16:00"}
  ]
}
```

Hit the refresh icon in the popover after editing.

## Emergency override

1. Click the menu bar icon → **Emergency Override**
2. App emails a fresh 10-char one-time code to your partner via Resend
3. 60-second countdown — input field is disabled
4. Text your partner for the code
5. Type it → unlock

Code lives in memory only. Quit the app, code is gone — request another. Wrong code just shows an error. There's no retry limit; the slowdown is the wait + the social cost of asking your partner.

## How blocking works

When a lockout starts, the app shells out via `osascript ... with administrator privileges` to:
1. Strip any `# === TILTBLOCKER START ===` / `# === TILTBLOCKER END ===` block from `/etc/hosts`
2. Append a fresh block with `0.0.0.0 <domain>` + `0.0.0.0 www.<domain>` for each entry
3. Flush DNS (`dscacheutil -flushcache`, `killall -HUP mDNSResponder`)

Sites resolve to `0.0.0.0` across every browser. macOS will ask for your password the first time per session.

State persists in `~/.tiltblocker/state.json` so quitting the app does not end an active lockout.

## Project layout

```
TiltBlocker/
├── Package.swift
├── build-app.sh
├── Sources/TiltBlocker/
│   ├── App.swift              # MenuBarExtra entry + AppDelegate (accessory policy)
│   ├── ContentView.swift      # popover UI (setup, main, emergency)
│   ├── AppState.swift         # ObservableObject driving the UI
│   ├── Blocker.swift          # /etc/hosts manipulation
│   ├── Config.swift           # blocklist + schedule loading, ~/.tiltblocker/
│   ├── Scheduler.swift        # window matching
│   ├── Keychain.swift         # Keychain wrapper + SHA256 hash
│   └── ResendClient.swift     # Resend API client
└── legacy/                    # the old Electron implementation, archived
```

## Caveats

- Hosts-file blocking doesn't catch native apps that use IP directly — fine for browser-based platforms.
- The osascript admin prompt appears every time the app needs to touch hosts after a reboot or long idle. For seamless background use, port to `SMAppService` privileged helper later.
- App is ad-hoc signed. Gatekeeper will let it run because you built it locally; if you ever copy the `.app` to another Mac it will refuse.
