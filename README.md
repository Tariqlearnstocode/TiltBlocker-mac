# Trader Browser Block (TiltBlocker)

A desktop application designed to help traders manage impulsive behavior by blocking access to specific trading platforms and URLs during defined periods. This is a professional risk management tool for day traders and trading firms.

## 🎯 Key Features

### Currently Implemented ✅
- **System-wide URL blocking**: Block websites across all browsers (Chrome, Firefox, Safari, Edge) via hosts file manipulation
- **Time-based lockouts**: Temporary blocks from 15 minutes to 24+ hours
- **Trading session lockouts**: Block until end of New York, London, Tokyo, or Sydney trading sessions
- **Emergency access**: Password-protected override to stop active lockouts
- **Desktop application**: Electron-based GUI with system tray integration
- **Cross-platform**: Windows, macOS, and Linux support
- **Domain variation blocking**: Automatically blocks subdomains (www, app, api, etc.) for comprehensive coverage

### Planned Features 🚧
- **Application blocking**: Block specific desktop trading applications and processes (code exists but not integrated)
- **Scheduled restrictions**: Daily/weekly recurring blocks
- **Tamper protection**: Self-protecting application with admin privileges
- **Audit logging**: Comprehensive activity logs (database structure exists but not used)
- **Encrypted storage**: Secure configuration and audit logs

## 🏗️ Architecture

### Technology Stack
- **Framework**: Electron with Node.js backend
- **GUI**: React with TypeScript for the frontend (desktop application, not web-based)
- **Background Service**: Express.js API server running on localhost:3001
- **Storage**: Currently uses localStorage for rules (database exists but not integrated)
- **Network**: DNS manipulation via hosts file modification
- **Blocking Method**: Hosts file entries redirecting blocked domains to 127.0.0.1

### Components
1. **Background Service** (`packages/service`): 
   - Currently uses `simple-service.ts` (simplified implementation)
   - Full-featured service (`index.ts`) exists but not active
   - Runs as standalone Node.js process (not installed as system service)
2. **GUI Application** (`packages/app`): Electron desktop app with React UI
3. **Shared Library** (`packages/core`): Common utilities, types, and database abstraction
4. **Database**: `SimpleDatabase` class exists (file-based JSON storage) but is not currently used by the simple service

## 📦 Project Structure

```
traderbrowserblock/
├── packages/
│   ├── core/              # Shared utilities and models
│   ├── service/           # Background blocking service
│   ├── app/              # Electron GUI application
│   └── installer/        # Installation packages
├── docs/                 # Documentation and architecture
├── scripts/              # Build and deployment scripts
└── tests/               # Integration and e2e tests
```

## 🚀 Quick Start

### Development Setup
```bash
# Install dependencies
npm install

# Start development environment
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Installation
1. Download the installer for your platform
2. Run as administrator/root
3. Follow the installation wizard
4. Configure your first blocking rules

## 🔧 Configuration

### Settings Location
**All settings are accessed through the desktop application** - there is no web interface. The Electron app provides a settings modal with tabs for:
- **Blocklist**: Add/remove URLs to block
- **Lockout**: Configure lockout duration or trading session
- **Emergency**: Set emergency override password

### Current Storage
- **Rules**: Stored in browser localStorage (in Electron renderer process)
- **Service State**: In-memory in the simple service (not persisted)
- **Database**: File-based JSON storage exists but not currently used

### Block Rules
- **URLs**: Domain-based blocking (automatically includes subdomain variations)
- **Lockout Duration**: 15 minutes, 30 minutes, 1 hour, all day, or custom
- **Trading Sessions**: Block until end of New York, London, Tokyo, or Sydney session
- **Emergency Access**: Password-protected override (stored in component state)

### Planned Features
- **Schedules**: Cron-like expressions for recurring blocks
- **Process Blocking**: Application and process name blocking
- **Persistent Storage**: Database integration for rules and audit logs
- **Admin Lock**: Require admin password for configuration changes

## 📊 Performance Targets

- **CPU Usage**: <2% average, <5% peak
- **Memory Usage**: <100MB RAM
- **Startup Time**: <3 seconds
- **Response Time**: <100ms for block enforcement
- **Uptime**: 99.9% reliability target

## 🔐 Security Features

### Currently Implemented
- **Admin Privileges**: Required for hosts file modification
- **Emergency Password**: Password-protected override for active lockouts
- **Domain Blocking**: Comprehensive subdomain blocking to prevent bypass attempts

### Planned Features
- **Data Encryption**: AES-256 for configuration and logs
- **Self-Protection**: Prevent unauthorized termination
- **Audit Trail**: Immutable logging for compliance (database structure ready)

## 🌐 Platform Support

- **Windows**: Windows 10, 11 (x64)
- **macOS**: macOS 10.15+ (Intel and Apple Silicon)
- **Linux**: Ubuntu 18.04+, RHEL 8+, Debian 10+

## 📋 Current Implementation Status

### What's Working ✅
- URL blocking via hosts file modification
- Temporary lockouts with duration selection
- Trading session-based lockouts
- Emergency override with password
- Cross-platform desktop application
- System tray integration
- Domain variation generation for comprehensive blocking

### What's Not Yet Implemented ⚠️
- Process/application blocking (code exists but not integrated)
- Scheduled recurring blocks
- Database persistence (using localStorage instead)
- Audit logging (structure exists but not used)
- System service installation (runs as standalone process)
- Encrypted storage
- Tamper protection

### Database Status
The `SimpleDatabase` class exists and can store:
- Block rules (persistent)
- Block sessions (active/inactive)
- Configuration settings
- Audit logs

However, the current `simple-service.ts` does not use the database - it stores rules in memory. The frontend also uses localStorage instead of the database. To enable database features, either:
1. Switch to the full service (`packages/service/src/index.ts`), or
2. Integrate database calls into the simple service

## 🚨 Emergency Rescue Scripts

If you accidentally delete the application while a lockout is active, your system's HOSTS file may remain modified, blocking access to websites. We provide standalone rescue scripts to fix this:

### 🍎 macOS / 🐧 Linux
1. Download `scripts/rescue-system.sh`
2. Run in terminal:
   ```bash
   chmod +x rescue-system.sh
   sudo ./rescue-system.sh
   ```

### 🪟 Windows
1. Download `scripts/rescue-system.bat`
2. Right-click and select **"Run as Administrator"**

These scripts will remove all Trader Block entries from your HOSTS file and flush your DNS cache, restoring full internet access.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and code standards.

## 📄 License

Proprietary software for professional trading environments. 

## 🚀 Quick Start Guide

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Start the Service (Requires Admin Privileges)**
   ```bash
   sudo npm run start-service
   ```

4. **Launch the GUI (Development Mode)**
   ```bash
   npm run dev
   ```
   This will:
   - Start the Vite dev server on port 5173
   - Launch the Electron desktop application
   - The app window will open automatically (not a browser)

5. **Access Settings**
   - Click the floating action button (FAB) in the app window
   - Or use the system tray icon to open settings
   - Settings are in the desktop application, not a web browser

6. **Configure Block Rules**
   - Add URLs to block via the Blocklist tab in settings
   - Rules are saved to localStorage
   - Start a lockout from the Lockout tab

7. **Check Service Status**
   ```bash
   curl http://localhost:3001/api/status
   ```

For detailed configuration and advanced usage, see [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md).



### Common Issues

1. **Service Won't Start**
   ```bash
   # Check permissions
   ls -la /path/to/service
   
   # Check logs
   tail -f ~/.trader-block/logs/service.log
   
   # Restart with elevated privileges
   sudo npm run start-service
   ```

2. **URL Blocking Not Working**
   ```bash
   # Check hosts file
   cat /etc/hosts | grep TRADER-BLOCK
   
   # Flush DNS cache manually
   sudo dscacheutil -flushcache  # macOS
   ipconfig /flushdns            # Windows
   sudo systemctl restart systemd-resolved  # Linux
   ```

3. **Lockout Not Working**
   ```bash
   # Check if service is running
   curl http://localhost:3001/health
   
   # Check hosts file for blocks
   cat /etc/hosts | grep TRADER-BLOCK  # macOS/Linux
   type C:\Windows\System32\drivers\etc\hosts | findstr TRADER-BLOCK  # Windows
   
   # Restart service if needed
   sudo npm run start-service
   ```

4. **Settings Not Persisting**
   - Rules are stored in localStorage (Electron renderer process)
   - Check browser DevTools > Application > Local Storage
   - Service state is in-memory and resets on restart