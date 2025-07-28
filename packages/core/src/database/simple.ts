import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { BlockRule, BlockSession, Configuration, AuditLog, LogLevel } from '../types';

interface DatabaseConfig {
  dataDir: string;
}

export class SimpleDatabase {
  private dataDir: string;
  private rulesFile: string;
  private sessionsFile: string;
  private configFile: string;
  private logsFile: string;

  constructor(config: DatabaseConfig) {
    this.dataDir = config.dataDir;
    this.rulesFile = path.join(config.dataDir, 'rules.json');
    this.sessionsFile = path.join(config.dataDir, 'sessions.json');
    this.configFile = path.join(config.dataDir, 'config.json');
    this.logsFile = path.join(config.dataDir, 'logs.json');
    
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
    return defaultValue;
  }

  private writeJsonFile<T>(filePath: string, data: T): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      throw error;
    }
  }

  // Block Rules Operations
  async createBlockRule(rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlockRule> {
    const rules = this.readJsonFile<BlockRule[]>(this.rulesFile, []);
    const now = new Date();
    
    const newRule: BlockRule = {
      ...rule,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    rules.push(newRule);
    this.writeJsonFile(this.rulesFile, rules);
    
    return newRule;
  }

  async getBlockRules(activeOnly = false): Promise<BlockRule[]> {
    const rules = this.readJsonFile<BlockRule[]>(this.rulesFile, []);
    return activeOnly ? rules.filter(rule => rule.isActive) : rules;
  }

  async getBlockRule(id: string): Promise<BlockRule | null> {
    const rules = this.readJsonFile<BlockRule[]>(this.rulesFile, []);
    return rules.find(rule => rule.id === id) || null;
  }

  async updateBlockRule(id: string, updates: Partial<BlockRule>): Promise<void> {
    const rules = this.readJsonFile<BlockRule[]>(this.rulesFile, []);
    const index = rules.findIndex(rule => rule.id === id);
    
    if (index !== -1) {
      rules[index] = {
        ...rules[index],
        ...updates,
        updatedAt: new Date()
      };
      this.writeJsonFile(this.rulesFile, rules);
    }
  }

  async deleteBlockRule(id: string): Promise<void> {
    const rules = this.readJsonFile<BlockRule[]>(this.rulesFile, []);
    const filteredRules = rules.filter(rule => rule.id !== id);
    this.writeJsonFile(this.rulesFile, filteredRules);
  }

  // Block Sessions Operations
  async createBlockSession(session: Omit<BlockSession, 'id'>): Promise<BlockSession> {
    const sessions = this.readJsonFile<BlockSession[]>(this.sessionsFile, []);
    const newSession: BlockSession = {
      ...session,
      id: uuidv4()
    };

    sessions.push(newSession);
    this.writeJsonFile(this.sessionsFile, sessions);
    
    return newSession;
  }

  async getActiveSessions(): Promise<BlockSession[]> {
    const sessions = this.readJsonFile<BlockSession[]>(this.sessionsFile, []);
    return sessions.filter(session => session.status === 'active');
  }

  async updateBlockSession(id: string, updates: Partial<BlockSession>): Promise<void> {
    const sessions = this.readJsonFile<BlockSession[]>(this.sessionsFile, []);
    const index = sessions.findIndex(session => session.id === id);
    
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      this.writeJsonFile(this.sessionsFile, sessions);
    }
  }

  // Configuration Operations
  async setConfig<T>(key: string, value: T): Promise<void> {
    const config = this.readJsonFile<Record<string, any>>(this.configFile, {});
    config[key] = value;
    this.writeJsonFile(this.configFile, config);
  }

  async getConfig<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const config = this.readJsonFile<Record<string, any>>(this.configFile, {});
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  // Audit Logging Operations
  async addAuditLog(log: Omit<AuditLog, 'id'>): Promise<void> {
    const logs = this.readJsonFile<AuditLog[]>(this.logsFile, []);
    const newLog: AuditLog = {
      ...log,
      id: uuidv4()
    };

    logs.push(newLog);
    
    // Keep only the last 1000 logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    this.writeJsonFile(this.logsFile, logs);
  }

  async getAuditLogs(limit = 100, offset = 0, level?: LogLevel): Promise<AuditLog[]> {
    const logs = this.readJsonFile<AuditLog[]>(this.logsFile, []);
    let filteredLogs = logs;
    
    if (level) {
      filteredLogs = logs.filter(log => log.level === level);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return filteredLogs.slice(offset, offset + limit);
  }

  async initialize(): Promise<void> {
    // Simple initialization - just ensure files exist
    this.readJsonFile<BlockRule[]>(this.rulesFile, []);
    this.readJsonFile<BlockSession[]>(this.sessionsFile, []);
    this.readJsonFile<Record<string, any>>(this.configFile, {});
    this.readJsonFile<AuditLog[]>(this.logsFile, []);
  }

  async close(): Promise<void> {
    // Nothing to close for file-based storage
  }
} 