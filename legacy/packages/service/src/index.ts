#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as path from 'path';
import * as fs from 'fs';
import { 
  SimpleDatabase, 
  BlockRule, 
  BlockSession, 
  Configuration, 
  BlockStatus,
  EventType,
  LogLevel,
  getCurrentPlatform,
  getAppDataDir,
  generateEncryptionKey
} from '@trader-block/core';
import { UrlBlocker } from './blockers/url-blocker';
import { ProcessBlocker } from './blockers/process-blocker';

interface ServiceConfig {
  port: number;
  dataDir: string;
  logLevel: LogLevel;
  enableCors: boolean;
  maxRequestsPerMinute: number;
}

export class TraderBlockService {
  private app: express.Application;
  private server: any;
  private database!: SimpleDatabase;
  private urlBlocker!: UrlBlocker;
  private processBlocker!: ProcessBlocker;
  private config: ServiceConfig;
  private isRunning = false;
  private startTime = Date.now();

  constructor(config?: Partial<ServiceConfig>) {
    this.config = {
      port: 3001,
      dataDir: path.join(getAppDataDir(), 'TraderBlock'),
      logLevel: LogLevel.INFO,
      enableCors: true,
      maxRequestsPerMinute: 60,
      ...config
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    // Initialize components
    this.initializeDatabase();
    this.urlBlocker = new UrlBlocker();
    this.processBlocker = new ProcessBlocker();
  }

  /**
   * Initialize the database
   */
  private initializeDatabase(): void {
    this.database = new SimpleDatabase({
      dataDir: this.config.dataDir
    });
  }

  /**
   * Get or create encryption key
   */
  private getOrCreateEncryptionKey(): string {
    const keyPath = path.join(this.config.dataDir, '.encryption-key');
    
    try {
      return fs.readFileSync(keyPath, 'utf8');
    } catch {
      const newKey = generateEncryptionKey();
      
      // Ensure directory exists
      if (!fs.existsSync(this.config.dataDir)) {
        fs.mkdirSync(this.config.dataDir, { recursive: true });
      }
      
      fs.writeFileSync(keyPath, newKey, { mode: 0o600 }); // Restrict permissions
      return newKey;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: this.config.maxRequestsPerMinute,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // CORS
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true
      }));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      const status = await this.getSystemStatus();
      res.json({
        status: 'healthy',
        uptime: Date.now() - this.startTime,
        ...status
      });
    });

    // Block rules endpoints
    this.app.get('/api/rules', async (req, res) => {
      try {
        const rules = await this.database.getBlockRules();
        res.json(rules);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
      }
    });

    this.app.post('/api/rules', async (req, res) => {
      try {
        const rule = await this.database.createBlockRule(req.body);
        await this.applyCurrentRules();
        res.status(201).json(rule);
      } catch (error) {
        res.status(400).json({ error: 'Failed to create rule' });
      }
    });

    this.app.put('/api/rules/:id', async (req, res) => {
      try {
        await this.database.updateBlockRule(req.params.id, req.body);
        await this.applyCurrentRules();
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: 'Failed to update rule' });
      }
    });

    this.app.delete('/api/rules/:id', async (req, res) => {
      try {
        await this.database.deleteBlockRule(req.params.id);
        await this.applyCurrentRules();
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: 'Failed to delete rule' });
      }
    });

    // Emergency override
    this.app.post('/api/emergency-override/:ruleId', async (req, res) => {
      try {
        const { reason } = req.body;
        await this.handleEmergencyOverride(req.params.ruleId, reason);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: 'Emergency override failed' });
      }
    });

    // System status
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.getSystemStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get system status' });
      }
    });

    // Configuration endpoints
    this.app.get('/api/config', async (req, res) => {
      try {
        const config = await this.database.getConfig<Configuration>('system');
        res.json(config);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get configuration' });
      }
    });

    this.app.put('/api/config', async (req, res) => {
      try {
        await this.database.setConfig('system', req.body);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: 'Failed to update configuration' });
      }
    });

    // Audit logs
    this.app.get('/api/logs', async (req, res) => {
      try {
        const { limit = 100, offset = 0, level } = req.query;
        const logs = await this.database.getAuditLogs(
          Number(limit), 
          Number(offset), 
          level as LogLevel
        );
        res.json(logs);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
      }
    });

    // Service control
    this.app.post('/api/service/restart', async (req, res) => {
      try {
        await this.restart();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to restart service' });
      }
    });

    this.app.post('/api/service/stop', async (req, res) => {
      try {
        await this.stop();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to stop service' });
      }
    });
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Service is already running');
    }

    try {
      // Initialize database
      await this.database.initialize();
      
      // Initialize blockers
      await this.urlBlocker.initialize();
      await this.processBlocker.initialize();

      // Load and apply current rules
      await this.applyCurrentRules();

      // Start HTTP server
      this.server = this.app.listen(this.config.port, () => {
        console.log(`Trader Block Service started on port ${this.config.port}`);
        console.log(`Platform: ${getCurrentPlatform()}`);
        console.log(`Data directory: ${this.config.dataDir}`);
      });

      this.isRunning = true;
      
      // Log startup
      await this.database.addAuditLog({
        timestamp: new Date(),
        level: LogLevel.INFO,
        category: 'service',
        action: 'startup',
        details: {
          platform: getCurrentPlatform(),
          port: this.config.port
        }
      });

    } catch (error) {
      console.error('Failed to start service:', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Stop blockers
      this.processBlocker.stopMonitoring();
      await this.urlBlocker.removeAllBlocks();

      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => resolve());
        });
      }

      // Close database
      await this.database.close();

      this.isRunning = false;
      console.log('Trader Block Service stopped');

    } catch (error) {
      console.error('Error stopping service:', error);
      throw error;
    }
  }

  /**
   * Restart the service
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Apply current blocking rules
   */
  private async applyCurrentRules(): Promise<void> {
    try {
      const rules = await this.database.getBlockRules(true); // active only
      
      // Apply URL blocks
      await this.urlBlocker.applyBlocks(rules);
      
      // Start process monitoring
      this.processBlocker.startMonitoring(rules);

      console.log(`Applied ${rules.length} active blocking rules`);
    } catch (error) {
      console.error('Failed to apply rules:', error);
      throw error;
    }
  }

  /**
   * Handle emergency override request
   */
  private async handleEmergencyOverride(ruleId: string, reason: string): Promise<void> {
    const rule = await this.database.getBlockRule(ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    if (!rule.allowEmergencyOverride) {
      throw new Error('Emergency override not allowed for this rule');
    }

    // Add delay if specified
    if (rule.emergencyDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, rule.emergencyDelayMs));
    }

    // Temporarily disable the rule
    await this.database.updateBlockRule(ruleId, { isActive: false });
    
    // Log the override
    await this.database.addAuditLog({
      timestamp: new Date(),
      level: LogLevel.WARN,
      category: 'emergency',
      action: 'override',
      details: { ruleId, reason },
      ruleId
    });

    // Re-apply rules
    await this.applyCurrentRules();
  }

  /**
   * Get current system status
   */
  private async getSystemStatus(): Promise<any> {
    const rules = await this.database.getBlockRules();
    const activeRules = rules.filter(r => r.isActive);
    const activeSessions = await this.database.getActiveSessions();

    return {
      isServiceRunning: this.isRunning,
      platform: getCurrentPlatform(),
      uptime: Date.now() - this.startTime,
      totalRules: rules.length,
      activeRules: activeRules.length,
      activeSessions: activeSessions.length,
      urlBlocker: this.urlBlocker.getBlockingStatus(),
      processBlocker: this.processBlocker.getMonitoringStats(),
      memoryUsage: process.memoryUsage(),
      lastHealthCheck: new Date()
    };
  }
}

// CLI entry point
if (require.main === module) {
  const service = new TraderBlockService();
  
  service.start().catch(error => {
    console.error('Failed to start service:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    try {
      await service.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    try {
      await service.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
} 