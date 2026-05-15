# Trader Browser Block - Usage Examples

## 🎯 Common Use Cases for Traders

### 1. Day Trading Session Control

**Scenario**: Prevent access to social media and news sites during active trading hours.

```json
{
  "name": "Block Distractions During Trading",
  "type": "url",
  "pattern": "*.twitter.com|*.reddit.com|*.facebook.com|*news*",
  "isRegex": false,
  "isActive": true,
  "description": "Block social media and news during trading hours",
  "tags": ["social-media", "news", "distractions"],
  "schedule": "0 9-16 * * 1-5",
  "timezone": "America/New_York",
  "allowEmergencyOverride": true,
  "emergencyDelayMs": 60000
}
```

### 2. Prevent Revenge Trading

**Scenario**: Block trading platforms after a significant loss to prevent emotional decisions.

```json
{
  "name": "Cool-Down Period After Loss",
  "type": "application",
  "pattern": "TradingView|MetaTrader|ThinkorSwim",
  "isRegex": false,
  "isActive": false,
  "description": "30-minute cool-down after major loss",
  "duration": 1800000,
  "allowEmergencyOverride": false,
  "emergencyDelayMs": 0
}
```

### 3. Weekend Trading Restriction

**Scenario**: Prevent weekend trading to maintain work-life balance.

```json
{
  "name": "Weekend Trading Block",
  "type": "url",
  "pattern": "*.tradingview.com|*.thinkorswim.com|crypto exchanges",
  "isRegex": false,
  "isActive": true,
  "description": "No trading on weekends",
  "schedule": "0 0 * * 0,6",
  "timezone": "UTC",
  "allowEmergencyOverride": true,
  "emergencyDelayMs": 300000
}
```

## 📝 Rule Configuration Examples

### URL Blocking Patterns

```javascript
// Block specific domain
"example.com"

// Block all subdomains
"*.example.com"

// Block multiple domains
"*.twitter.com|*.reddit.com|*.youtube.com"

// Block all crypto exchanges
"*crypto*|*binance*|*coinbase*|*kraken*"

// Block news sites during trading
"*news*|*bloomberg*|*reuters*|*cnbc*"

// Regex pattern for advanced matching
"^https?://(www\\.)?(twitter|reddit|facebook)\\.(com|net)"
```

### Application Blocking Patterns

```javascript
// Block by executable name
"chrome.exe"
"firefox"
"MetaTrader4.exe"

// Block by process name (cross-platform)
"TradingView"
"thinkorswim"
"Interactive Brokers"

// Block cryptocurrency wallets
"Coinbase Wallet"
"MetaMask"
"Exodus"

// Block trading applications
"MetaTrader"
"NinjaTrader"
"cTrader"
```

### Schedule Patterns (Cron Format)

```bash
# Every weekday 9 AM to 4 PM (NYSE hours)
"0 9-16 * * 1-5"

# Monday to Friday 6:30 AM to 1 PM (Market hours)
"30 6-13 * * 1-5"

# Every hour during weekdays
"0 * * * 1-5"

# Specific times: 9:30 AM and 4 PM weekdays
"30 9,16 * * 1-5"

# Weekend block (Saturday and Sunday)
"* * * * 0,6"

# After-hours block (6 PM to 6 AM weekdays)
"0 18-23,0-6 * * 1-5"
```

## 🚀 Quick Setup Scenarios

### Scenario 1: New Day Trader Setup

```bash
# 1. Install and start the service
npm install -g @trader-block/app
trader-block install-service

# 2. Create basic rules via API
curl -X POST http://localhost:3001/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Block Social Media During Market Hours",
    "type": "url",
    "pattern": "*.twitter.com|*.reddit.com|*.facebook.com",
    "schedule": "30 9-16 * * 1-5",
    "timezone": "America/New_York"
  }'

# 3. Start the GUI
trader-block start
```

### Scenario 2: Institutional Trading Firm

```json
{
  "globalSettings": {
    "requireAdminForChanges": true,
    "emergencyDelayMs": 300000,
    "auditLogRetention": "90d"
  },
  "defaultRules": [
    {
      "name": "Block Personal Communication",
      "type": "url",
      "pattern": "*.whatsapp.com|*.telegram.org|*.discord.com",
      "schedule": "0 8-18 * * 1-5",
      "allowEmergencyOverride": false
    },
    {
      "name": "Block Entertainment Sites",
      "type": "url",
      "pattern": "*.youtube.com|*.netflix.com|*.twitch.tv",
      "schedule": "0 8-18 * * 1-5",
      "allowEmergencyOverride": true,
      "emergencyDelayMs": 600000
    },
    {
      "name": "Block Unauthorized Trading Apps",
      "type": "application",
      "pattern": "Robinhood|Coinbase|Binance",
      "isActive": true,
      "allowEmergencyOverride": false
    }
  ]
}
```

### Scenario 3: Risk Management for Prop Traders

```javascript
// Dynamic rule creation based on P&L
const createRiskRule = (currentPnL, maxLoss) => {
  if (currentPnL <= maxLoss) {
    return {
      name: "Daily Loss Limit Reached",
      type: "application",
      pattern: "TradingPlatform.*",
      isRegex: true,
      isActive: true,
      duration: 24 * 60 * 60 * 1000, // 24 hours
      allowEmergencyOverride: false,
      description: `Trading suspended due to daily loss limit of ${maxLoss}`
    };
  }
};

// Automatic rule activation via API
fetch('http://localhost:3001/api/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createRiskRule(-500, -500))
});
```

## 🔧 Configuration Templates

### Conservative Trader Profile

```json
{
  "profile": "conservative",
  "settings": {
    "emergencyDelayMs": 600000,
    "requireAdminForChanges": true,
    "showNotifications": true
  },
  "rules": [
    {
      "name": "Limit Trading Hours",
      "type": "url",
      "pattern": "*trading*|*broker*",
      "schedule": "30 9-15 * * 1-5",
      "timezone": "America/New_York"
    },
    {
      "name": "Block High-Risk Instruments",
      "type": "url",
      "pattern": "*crypto*|*forex*|*options*",
      "isActive": true,
      "allowEmergencyOverride": true,
      "emergencyDelayMs": 900000
    },
    {
      "name": "Weekend Cooling Off",
      "type": "application",
      "pattern": ".*Trading.*",
      "isRegex": true,
      "schedule": "* * * * 0,6"
    }
  ]
}
```

### Aggressive Trader Profile

```json
{
  "profile": "aggressive",
  "settings": {
    "emergencyDelayMs": 60000,
    "requireAdminForChanges": false,
    "showNotifications": false
  },
  "rules": [
    {
      "name": "Focus Mode During Key Hours",
      "type": "url",
      "pattern": "*.reddit.com|*.twitter.com",
      "schedule": "30 9-10,14-16 * * 1-5",
      "description": "Block distractions during market open/close"
    },
    {
      "name": "Revenge Trading Prevention",
      "type": "application",
      "pattern": "TradingApp",
      "isActive": false,
      "duration": 300000,
      "description": "5-minute cool-down after activation"
    }
  ]
}
```

## 📊 Monitoring and Analytics

### Usage Statistics Query

```bash
# Get blocking statistics
curl http://localhost:3001/api/status

# Response example:
{
  "totalRules": 15,
  "activeRules": 8,
  "violationsToday": 3,
  "emergencyOverrides": 1,
  "uptime": 86400000,
  "blockedSites": ["twitter.com", "reddit.com"],
  "blockedApps": ["Chrome", "MetaTrader"]
}
```

### Audit Log Analysis

```bash
# Get recent violations
curl "http://localhost:3001/api/logs?category=violation&limit=50"

# Export logs for analysis
curl "http://localhost:3001/api/logs?limit=1000" > trading_logs.json

# Filter by date range
curl "http://localhost:3001/api/logs?from=2024-01-01&to=2024-01-31"
```

### Performance Metrics

```javascript
// Monitor service health
const checkHealth = async () => {
  const response = await fetch('http://localhost:3001/health');
  const health = await response.json();
  
  console.log(`CPU Usage: ${health.cpuUsage}%`);
  console.log(`Memory: ${health.memoryUsage / 1024 / 1024} MB`);
  console.log(`Active Blocks: ${health.activeBlocks}`);
  console.log(`Uptime: ${health.uptime / 1000 / 60} minutes`);
};

setInterval(checkHealth, 60000); // Check every minute
```

## 🔐 Security Best Practices

### Administrative Controls

```json
{
  "securitySettings": {
    "requireAdminPassword": true,
    "adminPasswordHash": "sha256_hash_here",
    "lockConfigurationChanges": true,
    "maxEmergencyOverrides": 3,
    "emergencyOverrideCooldown": 3600000,
    "auditLogEncryption": true,
    "tamperProtection": true
  }
}
```

### Emergency Override Policies

```javascript
// Corporate policy example
const emergencyOverridePolicy = {
  // Maximum 3 overrides per day
  maxDailyOverrides: 3,
  
  // Increasing delays for subsequent overrides
  delayPolicy: [
    { override: 1, delay: 60000 },   // 1 minute
    { override: 2, delay: 300000 },  // 5 minutes
    { override: 3, delay: 900000 }   // 15 minutes
  ],
  
  // Require supervisor approval after 2 overrides
  supervisorApprovalRequired: 2,
  
  // Automatic re-enable after override
  autoReEnableAfter: 1800000 // 30 minutes
};
```

## 🎨 Custom GUI Themes

### Dark Theme for Late Trading

```css
/* packages/app/src/renderer/themes/dark.css */
:root {
  --primary-color: #1976d2;
  --background-color: #121212;
  --surface-color: #1e1e1e;
  --text-color: #ffffff;
  --error-color: #f44336;
  --warning-color: #ff9800;
  --success-color: #4caf50;
}

.dashboard {
  background: var(--background-color);
  color: var(--text-color);
}

.rule-item {
  background: var(--surface-color);
  border: 1px solid #333;
}

.status-indicator.active {
  color: var(--success-color);
}

.status-indicator.blocked {
  color: var(--error-color);
}
```

### Professional Theme for Firms

```css
/* packages/app/src/renderer/themes/professional.css */
:root {
  --primary-color: #2c5aa0;
  --secondary-color: #37474f;
  --background-color: #fafafa;
  --surface-color: #ffffff;
  --text-color: #212121;
  --accent-color: #ff5722;
}

.header {
  background: var(--primary-color);
  color: white;
  padding: 1rem;
}

.sidebar {
  background: var(--secondary-color);
  color: white;
}

.card {
  background: var(--surface-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 4px;
}
```

## 📱 Mobile Companion Integration

### Basic Monitoring API

```javascript
// Simple REST API for mobile companion app
app.get('/api/mobile/status', (req, res) => {
  res.json({
    isActive: service.isRunning,
    activeBlocks: service.getActiveBlocks().length,
    lastViolation: service.getLastViolation(),
    emergencyAvailable: service.canEmergencyOverride()
  });
});

app.post('/api/mobile/emergency', (req, res) => {
  const { ruleId, reason, approvalCode } = req.body;
  
  if (validateApprovalCode(approvalCode)) {
    service.emergencyOverride(ruleId, reason);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid approval code' });
  }
});
```

## 🔄 Backup and Recovery

### Automated Backup Strategy

```bash
#!/bin/bash
# backup-trader-block.sh

BACKUP_DIR="/backup/trader-block"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DATA="$HOME/.trader-block"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database and configuration
tar -czf "$BACKUP_DIR/trader-block-$DATE.tar.gz" \
  "$APP_DATA/trader-block.db" \
  "$APP_DATA/config.json" \
  "$APP_DATA/logs/"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "trader-block-*.tar.gz" -mtime +30 -delete

echo "Backup completed: trader-block-$DATE.tar.gz"
```

### Disaster Recovery

```bash
#!/bin/bash
# restore-trader-block.sh

BACKUP_FILE="$1"
APP_DATA="$HOME/.trader-block"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Stop service
sudo systemctl stop trader-block-service

# Restore from backup
tar -xzf "$BACKUP_FILE" -C "/"

# Restart service
sudo systemctl start trader-block-service

echo "Restore completed from $BACKUP_FILE"
```

This comprehensive usage guide provides traders with practical examples and configurations for implementing effective risk management through controlled access restrictions. 