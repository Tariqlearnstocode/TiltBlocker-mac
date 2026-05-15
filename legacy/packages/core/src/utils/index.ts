import * as crypto from 'crypto';
import * as os from 'os';
import { Platform } from '../types';

/**
 * Generate a secure random key for encryption
 */
export function generateEncryptionKey(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password with salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Get the current platform
 */
export function getCurrentPlatform(): Platform {
  const platform = os.platform();
  switch (platform) {
    case 'win32':
      return Platform.WINDOWS;
    case 'darwin':
      return Platform.MACOS;
    case 'linux':
      return Platform.LINUX;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get application data directory
 */
export function getAppDataDir(): string {
  const platform = getCurrentPlatform();
  const homeDir = os.homedir();
  
  switch (platform) {
    case Platform.WINDOWS:
      return process.env.APPDATA || `${homeDir}\\AppData\\Roaming`;
    case Platform.MACOS:
      return `${homeDir}/Library/Application Support`;
    case Platform.LINUX:
      return process.env.XDG_CONFIG_HOME || `${homeDir}/.config`;
    default:
      return `${homeDir}/.trader-block`;
  }
}

/**
 * Validate URL pattern
 */
export function validateUrlPattern(pattern: string, isRegex = false): boolean {
  if (!pattern.trim()) return false;
  
  if (isRegex) {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }
  
  // Basic URL validation for wildcard patterns
  const wildcardPattern = pattern.replace(/\*/g, '.*');
  try {
    new RegExp(wildcardPattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a URL matches a pattern
 */
export function matchesUrlPattern(url: string, pattern: string, isRegex = false): boolean {
  if (isRegex) {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(url);
    } catch {
      return false;
    }
  }
  
  // Convert wildcard pattern to regex
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wildcardPattern = escaped.replace(/\\\*/g, '.*');
  
  try {
    const regex = new RegExp(`^${wildcardPattern}$`, 'i');
    return regex.test(url);
  } catch {
    return false;
  }
}

/**
 * Generate comprehensive domain variations for blocking
 * This ensures subdomains and common patterns are included
 * 
 * Example: generateDomainVariations('tradovate.com', true) will return:
 * ['tradovate.com', 'www.tradovate.com', 'app.tradovate.com', 'api.tradovate.com', 
 *  'm.tradovate.com', 'mobile.tradovate.com', 'web.tradovate.com', 'secure.tradovate.com',
 *  'login.tradovate.com', 'auth.tradovate.com', 'trader.tradovate.com', 'live.tradovate.com',
 *  'demo.tradovate.com', 'platform.tradovate.com', etc.]
 * 
 * This will block trader.tradovate.com, app.tradovate.com, and any other subdomain automatically.
 */
export function generateDomainVariations(domain: string, aggressive = true): string[] {
  const variations = new Set<string>();
  
  // Remove protocol and www prefix to get base domain
  const baseDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();
  
  if (!baseDomain.includes('.')) {
    return [baseDomain]; // Not a valid domain
  }
  
  // Add the base domain
  variations.add(baseDomain);
  
  // Add www variant
  variations.add(`www.${baseDomain}`);
  
  // Basic subdomains that are almost universal
  const basicSubdomains = ['app', 'api', 'm', 'mobile', 'web', 'www'];
  
  for (const subdomain of basicSubdomains) {
    variations.add(`${subdomain}.${baseDomain}`);
  }
  
  if (aggressive) {
    // Additional common subdomains for comprehensive blocking
    const aggressiveSubdomains = [
      'secure', 'login', 'auth', 'signin', 'admin', 'portal', 'dashboard',
      'client', 'account', 'accounts', 'live', 'demo', 'beta', 'alpha',
      'staging', 'dev', 'test', 'sandbox', 'trade', 'trading', 'trader',
      'platform', 'pro', 'premium', 'advanced', 'desktop'
    ];
    
    for (const subdomain of aggressiveSubdomains) {
      variations.add(`${subdomain}.${baseDomain}`);
    }
  }
  
  return Array.from(variations);
}

/**
 * Check if a URL should be blocked by a domain pattern
 * This includes comprehensive subdomain checking
 */
export function shouldBlockUrl(url: string, domainPattern: string): boolean {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Generate all variations of the domain pattern
    const variations = generateDomainVariations(domainPattern, true);
    
    // Check if hostname matches any variation
    for (const variation of variations) {
      if (hostname === variation || hostname.endsWith(`.${variation}`)) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(duration: string): number {
  const regex = /(\d+)([dhms])/g;
  let total = 0;
  let match;
  
  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'd':
        total += value * 24 * 60 * 60 * 1000;
        break;
      case 'h':
        total += value * 60 * 60 * 1000;
        break;
      case 'm':
        total += value * 60 * 1000;
        break;
      case 's':
        total += value * 1000;
        break;
    }
  }
  
  return total;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError!;
} 

// Trading session definitions (all times in CT)
export interface TradingSession {
  name: string;
  startHour: number; // 24-hour format in CT
  startMinute: number;
  endHour: number;
  endMinute: number;
  isActive: (date: Date) => boolean; // function to check if session is active
}

export const TRADING_SESSIONS: Record<string, TradingSession> = {
  'NEW_YORK': {
    name: 'New York Session',
    startHour: 7,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
    isActive: (date: Date) => {
      const day = date.getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    }
  },
  'LONDON': {
    name: 'London Session', 
    startHour: 2,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
    isActive: (date: Date) => {
      const day = date.getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    }
  },
  'TOKYO': {
    name: 'Tokyo Session',
    startHour: 18,
    startMinute: 0,
    endHour: 3,
    endMinute: 0,
    isActive: (date: Date) => {
      const day = date.getDay();
      return day >= 0 && day <= 4; // Sunday to Thursday (spans to next day)
    }
  },
  'SYDNEY': {
    name: 'Sydney Session',
    startHour: 16,
    startMinute: 0,
    endHour: 1,
    endMinute: 0,
    isActive: (date: Date) => {
      const day = date.getDay();
      return day >= 0 && day <= 4; // Sunday to Thursday (spans to next day)
    }
  }
};

// Get current time in CT
export function getCurrentCTTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Chicago"}));
}

// Calculate when a trading session ends
export function getSessionEndTime(sessionKey: string): Date | null {
  const session = TRADING_SESSIONS[sessionKey];
  if (!session) return null;

  const now = getCurrentCTTime();
  
  if (!session.isActive(now)) {
    return null; // Session not available today
  }

  const today = new Date(now);
  today.setHours(session.endHour, session.endMinute, 0, 0);

  // Handle sessions that end next day (like Tokyo, Sydney)
  if (session.endHour < session.startHour) {
    const currentHour = now.getHours();
    if (currentHour >= session.startHour || currentHour < session.endHour) {
      // We're in the session, end time is tomorrow
      if (currentHour < session.endHour) {
        // Already past midnight, end time is today
        return today;
      } else {
        // Before midnight, end time is tomorrow
        today.setDate(today.getDate() + 1);
        return today;
      }
    } else {
      return null; // Not in session window
    }
  }

  // Regular sessions (end same day)
  if (now < today) {
    return today; // Session ends later today
  }
  
  return null; // Session already ended
}

// Check if a trading session is currently available for lockout
export function isSessionAvailable(sessionKey: string): boolean {
  return getSessionEndTime(sessionKey) !== null;
}

// Format session time for display
export function formatSessionTime(sessionKey: string, userTimezone: string = 'America/Chicago'): string {
  const session = TRADING_SESSIONS[sessionKey];
  if (!session) return '';

  // Create time in CT
  const startTime = new Date();
  startTime.setHours(session.startHour, session.startMinute, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(session.endHour, session.endMinute, 0, 0);

  // Convert to user timezone for display
  const startFormatted = startTime.toLocaleTimeString('en-US', {
    timeZone: userTimezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const endFormatted = endTime.toLocaleTimeString('en-US', {
    timeZone: userTimezone, 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const timezone = userTimezone === 'America/Chicago' ? 'CT' : 
                  userTimezone === 'America/New_York' ? 'ET' :
                  userTimezone === 'America/Los_Angeles' ? 'PT' : 'Local';

  return `(${startFormatted}-${endFormatted} ${timezone})`;
} 