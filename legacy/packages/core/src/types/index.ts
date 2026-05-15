import { z } from 'zod';

// ============================================================================
// Core Data Models
// ============================================================================

export enum BlockType {
  URL = 'url',
  APPLICATION = 'application',
  PROCESS = 'process'
}

export enum BlockStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
  EMERGENCY_OVERRIDE = 'emergency_override'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum Platform {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux'
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const BlockRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(BlockType),
  pattern: z.string().min(1), // URL pattern, app name, or process name
  isRegex: z.boolean().default(false),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Time-based restrictions
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  duration: z.number().min(0).optional(), // Duration in milliseconds
  // Recurring schedule (cron-like)
  schedule: z.string().optional(),
  timezone: z.string().default('UTC'),
  // Emergency access settings
  allowEmergencyOverride: z.boolean().default(true),
  emergencyDelayMs: z.number().min(0).default(30000), // 30 second delay
  emergencyReason: z.string().optional()
});

export const BlockSessionSchema = z.object({
  id: z.string().uuid(),
  ruleId: z.string().uuid(),
  status: z.nativeEnum(BlockStatus),
  startTime: z.date(),
  endTime: z.date().optional(),
  isEmergencyOverride: z.boolean().default(false),
  overrideReason: z.string().optional(),
  violationCount: z.number().default(0),
  lastViolation: z.date().optional()
});

export const ConfigurationSchema = z.object({
  // Security settings
  requireAdminForChanges: z.boolean().default(true),
  adminPasswordHash: z.string().optional(),
  encryptionKey: z.string(),
  // Monitoring settings
  enableProcessMonitoring: z.boolean().default(true),
  enableNetworkMonitoring: z.boolean().default(true),
  monitoringIntervalMs: z.number().min(1000).default(5000), // 5 seconds
  // UI settings
  showNotifications: z.boolean().default(true),
  minimizeToTray: z.boolean().default(true),
  startWithSystem: z.boolean().default(true),
  // Logging settings
  logLevel: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  maxLogFiles: z.number().min(1).default(10),
  maxLogSizeMB: z.number().min(1).default(50),
  // Platform-specific settings
  platform: z.nativeEnum(Platform),
  useSystemFirewall: z.boolean().default(true),
  useHostsFile: z.boolean().default(true)
});

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  level: z.nativeEnum(LogLevel),
  category: z.string(),
  action: z.string(),
  details: z.record(z.any()),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ruleId: z.string().uuid().optional()
});

export const SystemStatusSchema = z.object({
  isServiceRunning: z.boolean(),
  activeBlocks: z.number(),
  totalRules: z.number(),
  uptime: z.number(), // milliseconds
  memoryUsage: z.number(), // bytes
  cpuUsage: z.number(), // percentage
  lastHealthCheck: z.date(),
  errors: z.array(z.string()),
  warnings: z.array(z.string())
});

// ============================================================================
// TypeScript Types (derived from Zod schemas)
// ============================================================================

export type BlockRule = z.infer<typeof BlockRuleSchema>;
export type BlockSession = z.infer<typeof BlockSessionSchema>;
export type Configuration = z.infer<typeof ConfigurationSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type SystemStatus = z.infer<typeof SystemStatusSchema>;

// ============================================================================
// API Types
// ============================================================================

export interface CreateBlockRuleRequest {
  name: string;
  type: BlockType;
  pattern: string;
  isRegex?: boolean;
  description?: string;
  tags?: string[];
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  schedule?: string;
  allowEmergencyOverride?: boolean;
  emergencyDelayMs?: number;
}

export interface UpdateBlockRuleRequest extends Partial<CreateBlockRuleRequest> {
  id: string;
}

export interface EmergencyOverrideRequest {
  ruleId: string;
  reason: string;
  requestedBy: string;
}

export interface SystemHealthResponse {
  status: SystemStatus;
  activeSessions: BlockSession[];
  recentLogs: AuditLog[];
}

// ============================================================================
// Event Types
// ============================================================================

export enum EventType {
  RULE_CREATED = 'rule_created',
  RULE_UPDATED = 'rule_updated',
  RULE_DELETED = 'rule_deleted',
  BLOCK_STARTED = 'block_started',
  BLOCK_ENDED = 'block_ended',
  VIOLATION_DETECTED = 'violation_detected',
  EMERGENCY_OVERRIDE = 'emergency_override',
  SERVICE_STARTED = 'service_started',
  SERVICE_STOPPED = 'service_stopped',
  CONFIG_CHANGED = 'config_changed'
}

export interface BlockEvent {
  type: EventType;
  timestamp: Date;
  ruleId?: string;
  sessionId?: string;
  data?: Record<string, any>;
}

// ============================================================================
// Error Types
// ============================================================================

export class BlockerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BlockerError';
  }
}

export class ValidationError extends BlockerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends BlockerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'PERMISSION_ERROR', details);
    this.name = 'PermissionError';
  }
}

export class ServiceError extends BlockerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SERVICE_ERROR', details);
    this.name = 'ServiceError';
  }
} 