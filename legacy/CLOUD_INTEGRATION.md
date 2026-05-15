# TiltBlocker Cloud Integration

This document describes the relationship between TiltBlocker Desktop and TiltBlocker Cloud.

---

## Two Separate Products

### TiltBlocker Desktop (This Repo)
**Location**: `/Users/tariqarchibald/Coding/TiltBlocker/`

- Electron-based desktop application
- System-level URL and application blocking
- Emergency password protection
- Local SQLite database
- Standalone product

### TiltBlocker Cloud (Separate Repo)
**Location**: `/Users/tariqarchibald/Coding/tiltblocker-cloud/`

- Next.js web application
- Tradovate trading integration
- Real-time PnL monitoring
- Risk management rules
- PostgreSQL database (Supabase)
- Cloud-based, accessible from anywhere

---

## Product Relationship

```
┌─────────────────────────────────┐
│    TiltBlocker Cloud (Web)      │
│  Main product - $29/month       │
│  • Trading risk management      │
│  • Real-time PnL monitoring     │
│  • API-level lockouts           │
└────────────┬────────────────────┘
             │
             │ Optional WebSocket
             │ (Future Integration)
             │
┌────────────▼────────────────────┐
│  TiltBlocker Desktop (Optional) │
│  Add-on - +$5/month             │
│  • System-level blocking        │
│  • Complete lockout             │
└─────────────────────────────────┘
```

**Key Point**: Cloud works standalone. Desktop is an optional enhancement.

---

## Future Integration

When both products are complete, the desktop app can optionally connect to the cloud:

### How It Will Work:
1. User signs up for TiltBlocker Cloud
2. User optionally installs TiltBlocker Desktop
3. Desktop connects to cloud via WebSocket
4. Cloud monitors trading activity
5. When risk rules are violated → Cloud sends command to Desktop
6. Desktop executes system-level lockout

### What Needs to Be Built:
- [ ] WebSocket client in Desktop app (connects to cloud)
- [ ] Authentication protocol (device registration)
- [ ] Command protocol (receive lockout commands)
- [ ] Status reporting (send health checks to cloud)

### Integration Points:
- Desktop will add: `packages/cloud-client/`
- Minimal changes to existing code
- Optional feature (can be disabled)

---

## Access Cloud Codebase

Navigate to cloud project:
```bash
cd /Users/tariqarchibald/Coding/tiltblocker-cloud
```

View documentation:
- `README.md` - Project overview
- `SETUP.md` - Setup instructions
- `PROJECT_STATUS.md` - Development progress
- `SUMMARY.md` - Build summary

Start cloud dev server:
```bash
cd /Users/tariqarchibald/Coding/tiltblocker-cloud
npm run dev
```

---

## Current Status

**Desktop**: ✅ Complete standalone app
**Cloud**: ✅ Backend complete, 🚧 Frontend in progress
**Integration**: ⏳ Not started (future enhancement)

---

## Git Repositories

Recommended setup:
- `github.com/yourusername/TiltBlocker` - Desktop app
- `github.com/yourusername/tiltblocker-cloud` - Cloud app

Keep them separate for independent deployment and versioning.

---

**For all cloud-related questions and documentation, see:**
`/Users/tariqarchibald/Coding/tiltblocker-cloud/`

