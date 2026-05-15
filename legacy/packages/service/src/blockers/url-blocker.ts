import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BlockRule, BlockType, Platform, getCurrentPlatform, matchesUrlPattern, generateDomainVariations } from '@trader-block/core';

const execAsync = promisify(exec);

interface HostsEntry {
  ip: string;
  hostname: string;
  comment?: string;
}

export class UrlBlocker {
  private platform: Platform;
  private hostsFilePath: string;
  private originalHostsContent: string = '';
  private blockedHosts: Map<string, string> = new Map();
  private readonly BLOCK_MARKER = '# TRADER-BLOCK';
  private readonly BLOCK_IP = '127.0.0.1';

  constructor() {
    this.platform = getCurrentPlatform();
    this.hostsFilePath = this.getHostsFilePath();
  }

  /**
   * Initialize the URL blocker
   */
  async initialize(): Promise<void> {
    try {
      // Read and backup original hosts file
      this.originalHostsContent = await fs.promises.readFile(this.hostsFilePath, 'utf8');
      
      // Parse existing blocked hosts
      await this.parseExistingBlocks();
      
      console.log('URL Blocker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize URL Blocker:', error);
      throw error;
    }
  }

  /**
   * Apply blocking rules for URLs
   */
  async applyBlocks(rules: BlockRule[]): Promise<void> {
    const urlRules = rules.filter(rule => 
      rule.type === BlockType.URL && rule.isActive
    );

    const hostsToBlock: HostsEntry[] = [];

    for (const rule of urlRules) {
      const hosts = this.extractHostsFromPattern(rule.pattern, rule.isRegex);
      for (const host of hosts) {
        hostsToBlock.push({
          ip: this.BLOCK_IP,
          hostname: host,
          comment: `${this.BLOCK_MARKER} - ${rule.name}`
        });
      }
    }

    await this.updateHostsFile(hostsToBlock);
    await this.flushDnsCache();
  }

  /**
   * Remove all blocks
   */
  async removeAllBlocks(): Promise<void> {
    await this.updateHostsFile([]);
    await this.flushDnsCache();
  }

  /**
   * Check if a URL is currently blocked
   */
  isUrlBlocked(url: string, rules: BlockRule[]): boolean {
    const urlRules = rules.filter(rule => 
      rule.type === BlockType.URL && rule.isActive
    );

    return urlRules.some(rule => 
      matchesUrlPattern(url, rule.pattern, rule.isRegex)
    );
  }

  /**
   * Get the hosts file path for the current platform
   */
  private getHostsFilePath(): string {
    switch (this.platform) {
      case Platform.WINDOWS:
        return path.join(process.env.WINDIR || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts');
      case Platform.MACOS:
      case Platform.LINUX:
        return '/etc/hosts';
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Extract hostnames from URL patterns
   */
  private extractHostsFromPattern(pattern: string, isRegex: boolean): string[] {
    if (isRegex) {
      // For regex patterns, we can't easily extract specific hosts
      // Return empty array - regex patterns need to be handled at browser level
      return [];
    }

    const hosts: Set<string> = new Set();
    
    // Handle different URL pattern formats
    if (pattern.includes('://')) {
      // Full URL: https://example.com/path
      try {
        const url = new URL(pattern.replace(/\*/g, 'wildcard'));
        const hostname = url.hostname.replace(/wildcard/g, '*');
        if (!hostname.includes('*')) {
          this.addDomainVariations(hostname, hosts);
        }
      } catch {
        // Invalid URL format
      }
    } else if (pattern.includes('.')) {
      // Domain: example.com or *.example.com
      const domain = pattern.replace(/https?:\/\//, '').split('/')[0];
      if (!domain.includes('*')) {
        this.addDomainVariations(domain, hosts);
      }
    }

    return Array.from(hosts);
  }

  /**
   * Add comprehensive domain variations for blocking
   * This ensures all subdomains, www variants, and common patterns are blocked
   */
  private addDomainVariations(domain: string, hosts: Set<string>): void {
    const variations = generateDomainVariations(domain, true);
    
    for (const variation of variations) {
      hosts.add(variation);
    }
  }

  /**
   * Parse existing blocks from hosts file
   */
  private async parseExistingBlocks(): Promise<void> {
    const lines = this.originalHostsContent.split('\n');
    let inBlockSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes(this.BLOCK_MARKER)) {
        inBlockSection = true;
        
        // Parse blocked host entry
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2 && parts[0] === this.BLOCK_IP) {
          const hostname = parts[1];
          this.blockedHosts.set(hostname, line);
        }
      } else if (inBlockSection && trimmed === '') {
        inBlockSection = false;
      }
    }
  }

  /**
   * Update hosts file with new blocking entries
   */
  private async updateHostsFile(hostsToBlock: HostsEntry[]): Promise<void> {
    try {
      // Remove existing trader-block entries
      let content = this.originalHostsContent;
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => 
        !line.includes(this.BLOCK_MARKER)
      );

      // Add new blocking entries
      if (hostsToBlock.length > 0) {
        filteredLines.push('');
        filteredLines.push(`${this.BLOCK_MARKER} - START`);
        
        for (const entry of hostsToBlock) {
          const line = `${entry.ip}\t${entry.hostname}\t${entry.comment || this.BLOCK_MARKER}`;
          filteredLines.push(line);
        }
        
        filteredLines.push(`${this.BLOCK_MARKER} - END`);
      }

      const newContent = filteredLines.join('\n');

      // Write to hosts file (requires admin privileges)
      await this.writeHostsFileWithElevation(newContent);
      
      // Update blocked hosts map
      this.blockedHosts.clear();
      for (const entry of hostsToBlock) {
        this.blockedHosts.set(entry.hostname, `${entry.ip}\t${entry.hostname}`);
      }

    } catch (error) {
      console.error('Failed to update hosts file:', error);
      throw error;
    }
  }

  /**
   * Write hosts file with elevated privileges
   */
  private async writeHostsFileWithElevation(content: string): Promise<void> {
    const tempFile = path.join(os.tmpdir(), `hosts-${Date.now()}.tmp`);
    
    try {
      // Write content to temporary file
      await fs.promises.writeFile(tempFile, content, 'utf8');

      // Copy with elevated privileges
      switch (this.platform) {
        case Platform.WINDOWS:
          await execAsync(`copy "${tempFile}" "${this.hostsFilePath}"`);
          break;
        case Platform.MACOS:
        case Platform.LINUX:
          await execAsync(`sudo cp "${tempFile}" "${this.hostsFilePath}"`);
          break;
      }

    } finally {
      // Clean up temporary file
      try {
        await fs.promises.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Flush DNS cache to apply changes immediately
   */
  private async flushDnsCache(): Promise<void> {
    try {
      switch (this.platform) {
        case Platform.WINDOWS:
          await execAsync('ipconfig /flushdns');
          break;
        case Platform.MACOS:
          await execAsync('sudo dscacheutil -flushcache');
          await execAsync('sudo killall -HUP mDNSResponder');
          break;
        case Platform.LINUX:
          // Try different methods based on available services
          try {
            await execAsync('sudo systemctl restart systemd-resolved');
          } catch {
            try {
              await execAsync('sudo service nscd restart');
            } catch {
              await execAsync('sudo /etc/init.d/networking restart');
            }
          }
          break;
      }
      console.log('DNS cache flushed successfully');
    } catch (error) {
      console.warn('Failed to flush DNS cache:', error);
      // Non-critical error - changes will still take effect eventually
    }
  }

  /**
   * Backup current hosts file
   */
  async backupHostsFile(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.hostsFilePath}.backup-${timestamp}`;
    
    await fs.promises.copyFile(this.hostsFilePath, backupPath);
    return backupPath;
  }

  /**
   * Restore hosts file from backup
   */
  async restoreHostsFile(backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const content = await fs.promises.readFile(backupPath, 'utf8');
    await this.writeHostsFileWithElevation(content);
    await this.flushDnsCache();
  }

  /**
   * Get current blocking status
   */
  getBlockingStatus(): {
    totalBlocked: number;
    blockedHosts: string[];
    hostsFilePath: string;
  } {
    return {
      totalBlocked: this.blockedHosts.size,
      blockedHosts: Array.from(this.blockedHosts.keys()),
      hostsFilePath: this.hostsFilePath
    };
  }

  /**
   * Test if admin privileges are available
   */
  async testAdminPrivileges(): Promise<boolean> {
    try {
      const testContent = this.originalHostsContent;
      await this.writeHostsFileWithElevation(testContent);
      return true;
    } catch {
      return false;
    }
  }
} 