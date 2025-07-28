#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateDomainVariations } from '@trader-block/core';

const execAsync = promisify(exec);

interface BlockRule {
  id: string;
  name: string;
  type: string;
  urlPatterns: string[];
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceConfig {
  port: number;
  dataDir: string;
}

export class SimpleTraderBlockService {
  private app: express.Application;
  private server: any;
  private config: ServiceConfig;
  private isRunning = false;
  private startTime = Date.now();
  private rules: BlockRule[] = [];
  private hostsFilePath: string;
  private hostsBackupPath: string;
  private readonly TRADER_BLOCK_MARKER = '# TRADER-BLOCK-START';
  private readonly TRADER_BLOCK_END = '# TRADER-BLOCK-END';
  private lockoutEndTime: Date | null = null;
  private lockoutTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ServiceConfig>) {
    this.config = {
      port: 3001,
      dataDir: path.join(os.homedir(), '.trader-block'),
      ...config
    };

    // Set hosts file path based on platform
    this.hostsFilePath = process.platform === 'win32' 
      ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
      : '/etc/hosts';
    
    this.hostsBackupPath = path.join(this.config.dataDir, 'hosts.backup');

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.ensureDataDirectory();
    this.createHostsBackup();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }
  }

  private async createHostsBackup(): Promise<void> {
    try {
      if (!fs.existsSync(this.hostsBackupPath)) {
        const hostsContent = fs.readFileSync(this.hostsFilePath, 'utf8');
        fs.writeFileSync(this.hostsBackupPath, hostsContent);
        console.log('📄 Created hosts file backup');
      }
    } catch (error) {
      console.error('⚠️  Could not create hosts backup:', error);
    }
  }

  private async updateHostsFile(): Promise<void> {
    try {
      // Read current hosts file
      let hostsContent = fs.readFileSync(this.hostsFilePath, 'utf8');
      
      // Remove existing trader block section
      const startIndex = hostsContent.indexOf(this.TRADER_BLOCK_MARKER);
      const endIndex = hostsContent.indexOf(this.TRADER_BLOCK_END);
      
      if (startIndex !== -1 && endIndex !== -1) {
        hostsContent = hostsContent.substring(0, startIndex) + 
                     hostsContent.substring(endIndex + this.TRADER_BLOCK_END.length);
      }
      
      // Get enabled rules
      const enabledRules = this.rules.filter(rule => rule.enabled);
      
      if (enabledRules.length > 0) {
        // Add new trader block section
        let blockSection = `\n${this.TRADER_BLOCK_MARKER}\n`;
        blockSection += `# Trader Block - Generated ${new Date().toISOString()}\n`;
        
        for (const rule of enabledRules) {
          for (const pattern of rule.urlPatterns) {
            // Clean the URL pattern to get base domain
            let domain = pattern.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            if (domain) {
              // Generate comprehensive blocking entries for this domain
              const domainVariations = generateDomainVariations(domain, true);
              
              for (const variation of domainVariations) {
                blockSection += `127.0.0.1 ${variation}\n`;
              }
            }
          }
        }
        
        blockSection += `${this.TRADER_BLOCK_END}\n`;
        hostsContent += blockSection;
      }
      
      // Write updated hosts file (requires admin privileges)
      fs.writeFileSync(this.hostsFilePath, hostsContent);
      
      // Flush DNS cache
      await this.flushDNSCache();
      
      console.log(`🚫 Updated hosts file with ${enabledRules.length} blocking rules`);
      
    } catch (error) {
      console.error('❌ Failed to update hosts file:', error);
      throw new Error('Failed to update hosts file. Make sure to run with administrator privileges.');
    }
  }

  private async flushDNSCache(): Promise<void> {
    try {
      let command = '';
      
      switch (process.platform) {
        case 'darwin': // macOS
          command = 'sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder';
          break;
        case 'win32': // Windows
          command = 'ipconfig /flushdns';
          break;
        case 'linux': // Linux
          command = 'sudo systemctl restart systemd-resolved || sudo service network-manager restart';
          break;
        default:
          console.log('⚠️  DNS cache flush not supported on this platform');
          return;
      }
      
      await execAsync(command);
      console.log('🔄 DNS cache flushed');
      
    } catch (error) {
      console.log('⚠️  Could not flush DNS cache:', error);
    }
  }

  private async stopLockout(): Promise<void> {
    // Clear all rules
    this.rules = [];
    
    // Clear lockout timer if it exists
    if (this.lockoutTimer) {
      clearTimeout(this.lockoutTimer);
      this.lockoutTimer = null;
    }
    
    // Clear lockout end time
    this.lockoutEndTime = null;
    
    // Remove all blocking (restore original hosts file)
    await this.restoreHostsFile();
  }

  private async restoreHostsFile(): Promise<void> {
    try {
      if (fs.existsSync(this.hostsBackupPath)) {
        const backupContent = fs.readFileSync(this.hostsBackupPath, 'utf8');
        fs.writeFileSync(this.hostsFilePath, backupContent);
        await this.flushDNSCache();
        console.log('🔄 Restored original hosts file');
      }
    } catch (error) {
      console.error('❌ Failed to restore hosts file:', error);
    }
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Date.now() - this.startTime,
        isServiceRunning: this.isRunning,
        platform: process.platform,
        totalRules: this.rules.length,
        activeRules: this.rules.filter(r => r.enabled).length,
        activeSessions: 0,
        memoryUsage: process.memoryUsage(),
        lastHealthCheck: new Date(),
        lockoutActive: this.lockoutEndTime !== null,
        lockoutEndTime: this.lockoutEndTime
      });
    });

    // Lockout control endpoints
    this.app.post('/start-lockout', async (req, res) => {
      try {
        const { duration, sites } = req.body;
        
        if (!Array.isArray(sites) || sites.length === 0) {
          return res.status(400).json({ error: 'No sites provided for blocking' });
        }

        // Create temporary rules for lockout period
        this.rules = sites.map((site: string, index: number) => ({
          id: `lockout-${Date.now()}-${index}`,
          name: `Lockout Block ${site}`,
          type: 'url',
          urlPatterns: [site],
          enabled: true,
          description: `Temporary lockout block for ${site}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        // Apply blocking immediately
        await this.updateHostsFile();
        
        // Set lockout end time and auto-stop timer
        this.lockoutEndTime = new Date(Date.now() + duration);
        
        // Clear any existing timer
        if (this.lockoutTimer) {
          clearTimeout(this.lockoutTimer);
        }
        
        // Set auto-stop timer
        this.lockoutTimer = setTimeout(async () => {
          try {
            await this.stopLockout();
            console.log('🔓 Auto-stopped lockout after duration expired');
          } catch (error) {
            console.error('Failed to auto-stop lockout:', error);
          }
        }, duration);
        
        console.log(`🔒 Started lockout for ${sites.length} sites, duration: ${duration}ms, ends at: ${this.lockoutEndTime.toISOString()}`);
        res.json({ 
          success: true, 
          sitesBlocked: sites.length,
          lockoutEndTime: this.lockoutEndTime
        });
        
      } catch (error) {
        console.error('Failed to start lockout:', error);
        res.status(500).json({ error: 'Failed to start lockout' });
      }
    });

    this.app.post('/stop-lockout', async (req, res) => {
      try {
        await this.stopLockout();
        console.log('🔓 Stopped lockout - all sites unblocked');
        res.json({ success: true });
        
      } catch (error) {
        console.error('Failed to stop lockout:', error);
        res.status(500).json({ error: 'Failed to stop lockout' });
      }
    });

    this.app.post('/extend-lockout', async (req, res) => {
      try {
        const { additionalMinutes } = req.body;
        if (!this.lockoutEndTime || !this.lockoutTimer) {
          return res.status(400).json({ error: 'No active lockout to extend' });
        }

        // Extend the lockout time
        this.lockoutEndTime = new Date(this.lockoutEndTime.getTime() + additionalMinutes * 60 * 1000);

        // Clear the old timer
        clearTimeout(this.lockoutTimer);

        // Set a new timer for the updated duration
        const newDuration = this.lockoutEndTime.getTime() - Date.now();
        if (newDuration > 0) {
          this.lockoutTimer = setTimeout(async () => {
            try {
              await this.stopLockout();
              console.log('🔓 Auto-stopped lockout after extended duration expired');
            } catch (error) {
              console.error('Failed to auto-stop extended lockout:', error);
            }
          }, newDuration);
        }

        console.log(`⏳ Extended lockout by ${additionalMinutes} minutes. New end time: ${this.lockoutEndTime.toISOString()}`);
        res.json({
          success: true,
          newLockoutEndTime: this.lockoutEndTime,
        });

      } catch (error) {
        console.error('Failed to extend lockout:', error);
        res.status(500).json({ error: 'Failed to extend lockout' });
      }
    });

    // Legacy endpoints (kept for compatibility but not actively used)
    this.app.get('/api/rules', (req, res) => {
      res.json(this.rules);
    });

    this.app.post('/api/rules', async (req, res) => {
      res.status(400).json({ error: 'Use /start-lockout instead' });
    });

    this.app.delete('/api/rules/:id', async (req, res) => {
      res.status(400).json({ error: 'Use /stop-lockout instead' });
    });

    // Emergency override
    this.app.post('/api/emergency-override/:ruleId', (req, res) => {
      try {
        const { reason } = req.body;
        const rule = this.rules.find(r => r.id === req.params.ruleId);
        if (rule) {
          rule.enabled = false;
          console.log(`Emergency override for rule ${rule.name}: ${reason}`);
          res.json({ success: true });
        } else {
          res.status(404).json({ error: 'Rule not found' });
        }
      } catch (error) {
        console.error('Emergency override failed:', error);
        res.status(400).json({ error: 'Emergency override failed' });
      }
    });

    // System status
    this.app.get('/api/status', (req, res) => {
      res.json({
        isServiceRunning: this.isRunning,
        platform: process.platform,
        uptime: Date.now() - this.startTime,
        totalRules: this.rules.length,
        activeRules: this.rules.filter(r => r.enabled).length,
        activeSessions: 0,
        memoryUsage: process.memoryUsage(),
        lastHealthCheck: new Date()
      });
    });

    // Logs endpoint
    this.app.get('/api/logs', (req, res) => {
      res.json([
        {
          id: '1',
          timestamp: new Date(),
          level: 'info',
          category: 'service',
          action: 'startup',
          details: { platform: process.platform }
        }
      ]);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Service is already running');
    }

    try {
      // Start HTTP server
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🚀 Trader Block Service started on port ${this.config.port}`);
        console.log(`📁 Data directory: ${this.config.dataDir}`);
        console.log(`🖥️  Platform: ${process.platform}`);
        console.log(`⏰ Started at: ${new Date().toISOString()}`);
        console.log(`🌐 Health check: http://localhost:${this.config.port}/health`);
      });

      this.isRunning = true;

    } catch (error) {
      console.error('❌ Failed to start service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Restore original hosts file before stopping
      await this.restoreHostsFile();
      
      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => resolve());
        });
      }

      this.isRunning = false;
      console.log('🛑 Trader Block Service stopped');

    } catch (error) {
      console.error('❌ Error stopping service:', error);
      throw error;
    }
  }
}

// CLI entry point
if (require.main === module) {
  const service = new SimpleTraderBlockService();
  
  service.start().catch(error => {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    try {
      await service.stop();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    try {
      await service.stop();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
} 