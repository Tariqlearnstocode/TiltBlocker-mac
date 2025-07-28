# Trader Browser Block

A sophisticated desktop application designed to help traders manage impulsive behavior by blocking access to specific trading platforms and URLs during defined periods. This is a professional risk management tool for day traders and trading firms.

## 🎯 Key Features

### Core Functionality
- **System-wide URL blocking**: Block websites across all browsers (Chrome, Firefox, Safari, Edge)
- **Application blocking**: Block specific desktop trading applications and processes
- **Time-based lockouts**: Temporary blocks from 15 minutes to 24+ hours
- **Scheduled restrictions**: Daily/weekly recurring blocks
- **Emergency access**: "Break glass" functionality with mandatory delays and logging
- **Tamper protection**: Self-protecting application with admin privileges

### Technical Features
- **Cross-platform**: Windows, macOS, and Linux support
- **Network-level blocking**: DNS manipulation and firewall rules
- **Process monitoring**: Real-time application detection and blocking
- **Low resource usage**: <2% CPU, <100MB RAM
- **Encrypted storage**: Secure configuration and audit logs
- **System tray integration**: Minimal UI footprint

## 🏗️ Architecture

### Technology Stack
- **Framework**: Electron with Node.js backend
- **GUI**: React with TypeScript for the frontend
- **System Service**: Native services (Windows Service, macOS LaunchDaemon, Linux systemd)
- **Database**: SQLite with encryption for local storage
- **Network**: DNS manipulation via hosts file and platform-specific APIs
- **Security**: Native admin privilege escalation and process protection

### Components
1. **Background Service** (`trader-block-service`): System-level enforcement engine
2. **GUI Application** (`trader-block-app`): User interface and configuration
3. **Shared Library** (`trader-block-core`): Common utilities and data models
4. **Installer**: Platform-specific installation packages

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

### Block Rules
- **URLs**: Wildcard patterns and regex support
- **Applications**: Process names and executable paths
- **Schedules**: Cron-like expressions for recurring blocks
- **Emergency Access**: Configurable delay periods and approval workflows

### Security Settings
- **Admin Lock**: Require admin password for configuration changes
- **Tamper Protection**: Prevent service termination and file modification
- **Audit Logging**: Comprehensive activity logs for compliance

## 📊 Performance Targets

- **CPU Usage**: <2% average, <5% peak
- **Memory Usage**: <100MB RAM
- **Startup Time**: <3 seconds
- **Response Time**: <100ms for block enforcement
- **Uptime**: 99.9% reliability target

## 🔐 Security Features

- **Privilege Escalation**: Secure admin rights handling
- **Data Encryption**: AES-256 for configuration and logs
- **Self-Protection**: Prevent unauthorized termination
- **Audit Trail**: Immutable logging for compliance

## 🌐 Platform Support

- **Windows**: Windows 10, 11 (x64)
- **macOS**: macOS 10.15+ (Intel and Apple Silicon)
- **Linux**: Ubuntu 18.04+, RHEL 8+, Debian 10+

## 📋 Compliance

This application meets professional trading requirements for:
- Risk management and impulse control
- Audit logging and reporting
- Administrative oversight and controls
- Data security and privacy protection

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and code standards.

## 📄 License

Proprietary software for professional trading environments. 

## 🐛 Troubleshooting

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

5. **Access the Interface**
   - Open your browser and go to [http://localhost:5173](http://localhost:5173)

6. **Configure Block Rules**
   - Add URLs or applications to block via the GUI.
   - Set schedules and emergency access options as needed.

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

3. **Process Blocking Fails**
   ```bash
   # Check if process exists
   ps aux | grep [process-name]
   
   # Check blocking rules
   curl http://localhost:3001/api/rules
   
   # Check service logs
   tail -f ~/.trader-block/logs/blocker.log
   ```