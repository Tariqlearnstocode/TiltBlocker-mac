import sqlite3 from 'sqlite3';
import * as crypto from 'crypto-js';
import * as path from 'path';
import * as fs from 'fs';
import { BlockRule, BlockSession, Configuration, AuditLog, LogLevel } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DatabaseConfig {
  dbPath: string;
  encryptionKey: string;
  maxConnections?: number;
  busyTimeout?: number;
}

export class SecureDatabase {
  private db: sqlite3.Database | null = null;
  private encryptionKey: string;
  private isInitialized = false;

  constructor(private config: DatabaseConfig) {
    this.encryptionKey = config.encryptionKey;
  }

  /**
   * Initialize the database connection and create tables
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Ensure database directory exists
      const dbDir = path.dirname(this.config.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Open database with encryption
      this.db = new sqlite3.Database(this.config.dbPath, (err) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }
        
        this.createTables()
          .then(() => {
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
      });

      // Configure database settings
      if (this.db) {
        this.db.configure('busyTimeout', this.config.busyTimeout || 5000);
        // Enable WAL mode for better concurrency
        this.db.run('PRAGMA journal_mode = WAL');
        // Enable foreign key constraints
        this.db.run('PRAGMA foreign_keys = ON');
      }
    });
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      // Block rules table
      `CREATE TABLE IF NOT EXISTS block_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('url', 'application', 'process')),
        pattern TEXT NOT NULL,
        is_regex INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        description TEXT,
        tags TEXT, -- JSON array
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        duration INTEGER,
        schedule TEXT,
        timezone TEXT DEFAULT 'UTC',
        allow_emergency_override INTEGER DEFAULT 1,
        emergency_delay_ms INTEGER DEFAULT 30000,
        emergency_reason TEXT,
        encrypted_data TEXT -- Encrypted sensitive data
      )`,

      // Block sessions table
      `CREATE TABLE IF NOT EXISTS block_sessions (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'scheduled', 'emergency_override')),
        start_time TEXT NOT NULL,
        end_time TEXT,
        is_emergency_override INTEGER DEFAULT 0,
        override_reason TEXT,
        violation_count INTEGER DEFAULT 0,
        last_violation TEXT,
        FOREIGN KEY (rule_id) REFERENCES block_rules(id) ON DELETE CASCADE
      )`,

      // Configuration table
      `CREATE TABLE IF NOT EXISTS configuration (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL, -- Encrypted JSON value
        updated_at TEXT NOT NULL
      )`,

      // Audit logs table
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT, -- Encrypted JSON details
        user_id TEXT,
        session_id TEXT,
        rule_id TEXT,
        FOREIGN KEY (rule_id) REFERENCES block_rules(id) ON DELETE SET NULL
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_block_rules_active ON block_rules(is_active, type)`,
      `CREATE INDEX IF NOT EXISTS idx_block_sessions_status ON block_sessions(status, start_time)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category, timestamp DESC)`
    ];

    for (const query of queries) {
      await this.runQuery(query);
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    return crypto.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    const bytes = crypto.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(crypto.enc.Utf8);
  }

  /**
   * Run a database query
   */
  private runQuery(query: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Get query results
   */
  private getQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  // ============================================================================
  // Block Rules Operations
  // ============================================================================

  async createBlockRule(rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlockRule> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const fullRule: BlockRule = {
      ...rule,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };

    const encryptedData = this.encrypt(JSON.stringify({
      pattern: rule.pattern,
      description: rule.description,
      emergencyReason: rule.emergencyReason
    }));

    await this.runQuery(
      `INSERT INTO block_rules (
        id, name, type, pattern, is_regex, is_active, description, tags,
        created_at, updated_at, start_time, end_time, duration, schedule,
        timezone, allow_emergency_override, emergency_delay_ms, emergency_reason,
        encrypted_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, rule.name, rule.type, rule.pattern, rule.isRegex ? 1 : 0,
        rule.isActive ? 1 : 0, rule.description, JSON.stringify(rule.tags),
        now, now, rule.startTime?.toISOString(), rule.endTime?.toISOString(),
        rule.duration, rule.schedule, rule.timezone,
        rule.allowEmergencyOverride ? 1 : 0, rule.emergencyDelayMs,
        rule.emergencyReason, encryptedData
      ]
    );

    return fullRule;
  }

  async getBlockRules(activeOnly = false): Promise<BlockRule[]> {
    const query = activeOnly 
      ? 'SELECT * FROM block_rules WHERE is_active = 1 ORDER BY name'
      : 'SELECT * FROM block_rules ORDER BY name';
    
    const rows = await this.getQuery<any>(query);
    
    return rows.map(row => this.mapRowToBlockRule(row));
  }

  async getBlockRule(id: string): Promise<BlockRule | null> {
    const rows = await this.getQuery<any>('SELECT * FROM block_rules WHERE id = ?', [id]);
    return rows.length > 0 ? this.mapRowToBlockRule(rows[0]) : null;
  }

  async updateBlockRule(id: string, updates: Partial<BlockRule>): Promise<void> {
    const now = new Date().toISOString();
    const setClause = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'createdAt') {
        setClause.push(`${this.camelToSnake(key)} = ?`);
        if (key === 'tags') {
          params.push(JSON.stringify(value));
        } else if (value instanceof Date) {
          params.push(value.toISOString());
        } else {
          params.push(value);
        }
      }
    }

    setClause.push('updated_at = ?');
    params.push(now);
    params.push(id);

    await this.runQuery(
      `UPDATE block_rules SET ${setClause.join(', ')} WHERE id = ?`,
      params
    );
  }

  async deleteBlockRule(id: string): Promise<void> {
    await this.runQuery('DELETE FROM block_rules WHERE id = ?', [id]);
  }

  // ============================================================================
  // Block Sessions Operations
  // ============================================================================

  async createBlockSession(session: Omit<BlockSession, 'id'>): Promise<BlockSession> {
    const id = uuidv4();
    const fullSession: BlockSession = { ...session, id };

    await this.runQuery(
      `INSERT INTO block_sessions (
        id, rule_id, status, start_time, end_time, is_emergency_override,
        override_reason, violation_count, last_violation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, session.ruleId, session.status, session.startTime.toISOString(),
        session.endTime?.toISOString(), session.isEmergencyOverride ? 1 : 0,
        session.overrideReason, session.violationCount,
        session.lastViolation?.toISOString()
      ]
    );

    return fullSession;
  }

  async getActiveSessions(): Promise<BlockSession[]> {
    const rows = await this.getQuery<any>(
      'SELECT * FROM block_sessions WHERE status = ? ORDER BY start_time DESC',
      ['active']
    );
    return rows.map(row => this.mapRowToBlockSession(row));
  }

  async updateBlockSession(id: string, updates: Partial<BlockSession>): Promise<void> {
    const setClause = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        setClause.push(`${this.camelToSnake(key)} = ?`);
        if (value instanceof Date) {
          params.push(value.toISOString());
        } else {
          params.push(value);
        }
      }
    }

    params.push(id);

    await this.runQuery(
      `UPDATE block_sessions SET ${setClause.join(', ')} WHERE id = ?`,
      params
    );
  }

  // ============================================================================
  // Configuration Operations
  // ============================================================================

  async setConfig<T>(key: string, value: T): Promise<void> {
    const encryptedValue = this.encrypt(JSON.stringify(value));
    const now = new Date().toISOString();

    await this.runQuery(
      'INSERT OR REPLACE INTO configuration (key, value, updated_at) VALUES (?, ?, ?)',
      [key, encryptedValue, now]
    );
  }

  async getConfig<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const rows = await this.getQuery<any>('SELECT value FROM configuration WHERE key = ?', [key]);
    
    if (rows.length === 0) {
      return defaultValue;
    }

    try {
      const decryptedValue = this.decrypt(rows[0].value);
      return JSON.parse(decryptedValue);
    } catch (error) {
      console.error(`Failed to decrypt config key ${key}:`, error);
      return defaultValue;
    }
  }

  // ============================================================================
  // Audit Logging Operations
  // ============================================================================

  async addAuditLog(log: Omit<AuditLog, 'id'>): Promise<void> {
    const id = uuidv4();
    const encryptedDetails = log.details ? this.encrypt(JSON.stringify(log.details)) : null;

    await this.runQuery(
      `INSERT INTO audit_logs (
        id, timestamp, level, category, action, details, user_id, session_id, rule_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, log.timestamp.toISOString(), log.level, log.category, log.action,
        encryptedDetails, log.userId, log.sessionId, log.ruleId
      ]
    );
  }

  async getAuditLogs(limit = 100, offset = 0, level?: LogLevel): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs';
    const params: any[] = [];

    if (level) {
      query += ' WHERE level = ?';
      params.push(level);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await this.getQuery<any>(query, params);
    return rows.map(row => this.mapRowToAuditLog(row));
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private mapRowToBlockRule(row: any): BlockRule {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      pattern: row.pattern,
      isRegex: Boolean(row.is_regex),
      isActive: Boolean(row.is_active),
      description: row.description,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
      schedule: row.schedule,
      timezone: row.timezone,
      allowEmergencyOverride: Boolean(row.allow_emergency_override),
      emergencyDelayMs: row.emergency_delay_ms,
      emergencyReason: row.emergency_reason
    };
  }

  private mapRowToBlockSession(row: any): BlockSession {
    return {
      id: row.id,
      ruleId: row.rule_id,
      status: row.status,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      isEmergencyOverride: Boolean(row.is_emergency_override),
      overrideReason: row.override_reason,
      violationCount: row.violation_count,
      lastViolation: row.last_violation ? new Date(row.last_violation) : undefined
    };
  }

  private mapRowToAuditLog(row: any): AuditLog {
    let details = undefined;
    if (row.details) {
      try {
        const decryptedDetails = this.decrypt(row.details);
        details = JSON.parse(decryptedDetails);
      } catch (error) {
        console.error('Failed to decrypt audit log details:', error);
      }
    }

    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      level: row.level,
      category: row.category,
      action: row.action,
      details,
      userId: row.user_id,
      sessionId: row.session_id,
      ruleId: row.rule_id
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          this.db = null;
          this.isInitialized = false;
          resolve();
        });
      });
    }
  }

  /**
   * Create a backup of the database
   */
  async backup(backupPath: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const backup = new sqlite3.Database(backupPath);
      // TypeScript doesn't know about the backup method, so we cast to any
      (this.db as any).backup(backup, (err: Error | null) => {
        backup.close();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
} 