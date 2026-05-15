import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { BlockRule, BlockType, Platform, getCurrentPlatform } from '@trader-block/core';

const execAsync = promisify(exec);

interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  path?: string;
  arguments?: string[];
}

export class ProcessBlocker {
  private platform: Platform;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private blockedProcesses: Set<string> = new Set();
  private terminatedProcesses: Map<number, number> = new Map(); // pid -> timestamp
  private readonly MONITOR_INTERVAL_MS = 2000; // Check every 2 seconds
  private readonly COOLDOWN_MS = 5000; // Prevent rapid restart spam

  constructor() {
    this.platform = getCurrentPlatform();
  }

  /**
   * Initialize the process blocker
   */
  async initialize(): Promise<void> {
    console.log('Process Blocker initialized successfully');
  }

  /**
   * Start monitoring processes
   */
  startMonitoring(rules: BlockRule[]): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.updateBlockedProcesses(rules);

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAndTerminateBlockedProcesses();
      } catch (error) {
        console.error('Error during process monitoring:', error);
      }
    }, this.MONITOR_INTERVAL_MS);

    console.log('Process monitoring started');
  }

  /**
   * Stop monitoring processes
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Process monitoring stopped');
  }

  /**
   * Update the list of blocked processes from rules
   */
  updateBlockedProcesses(rules: BlockRule[]): void {
    this.blockedProcesses.clear();
    
    const processRules = rules.filter(rule => 
      (rule.type === BlockType.APPLICATION || rule.type === BlockType.PROCESS) && 
      rule.isActive
    );

    for (const rule of processRules) {
      this.blockedProcesses.add(rule.pattern.toLowerCase());
    }

    console.log(`Updated blocked processes: ${Array.from(this.blockedProcesses).join(', ')}`);
  }

  /**
   * Check for and terminate blocked processes
   */
  private async checkAndTerminateBlockedProcesses(): Promise<void> {
    if (this.blockedProcesses.size === 0) return;

    const runningProcesses = await this.getRunningProcesses();
    const currentTime = Date.now();

    for (const process of runningProcesses) {
      if (this.isProcessBlocked(process)) {
        // Check cooldown to prevent rapid restart spam
        const lastTerminated = this.terminatedProcesses.get(process.pid);
        if (lastTerminated && (currentTime - lastTerminated) < this.COOLDOWN_MS) {
          continue;
        }

        try {
          await this.terminateProcess(process);
          this.terminatedProcesses.set(process.pid, currentTime);
          console.log(`Terminated blocked process: ${process.name} (PID: ${process.pid})`);
        } catch (error) {
          console.error(`Failed to terminate process ${process.name}:`, error);
        }
      }
    }

    // Clean up old termination records
    this.cleanupTerminationHistory(currentTime);
  }

  /**
   * Check if a process should be blocked
   */
  private isProcessBlocked(process: ProcessInfo): boolean {
    const processName = process.name.toLowerCase();
    const processPath = process.path?.toLowerCase() || '';
    const processCommand = process.command.toLowerCase();

    return Array.from(this.blockedProcesses).some(blockedPattern => {
      // Exact name match
      if (processName === blockedPattern) return true;
      
      // Executable name without extension
      const baseName = path.basename(processName, path.extname(processName));
      if (baseName === blockedPattern) return true;
      
      // Path contains pattern
      if (processPath.includes(blockedPattern)) return true;
      
      // Command line contains pattern
      if (processCommand.includes(blockedPattern)) return true;
      
      return false;
    });
  }

  /**
   * Get list of currently running processes
   */
  private async getRunningProcesses(): Promise<ProcessInfo[]> {
    switch (this.platform) {
      case Platform.WINDOWS:
        return this.getWindowsProcesses();
      case Platform.MACOS:
        return this.getMacOSProcesses();
      case Platform.LINUX:
        return this.getLinuxProcesses();
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Get Windows processes using tasklist
   */
  private async getWindowsProcesses(): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync('tasklist /fo csv /v');
      const lines = stdout.split('\n').slice(1); // Skip header
      const processes: ProcessInfo[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        const fields = this.parseCSVLine(line);
        if (fields.length >= 2) {
          processes.push({
            pid: parseInt(fields[1]),
            name: fields[0].replace(/"/g, ''),
            command: fields[0].replace(/"/g, ''),
            path: fields[0].replace(/"/g, '')
          });
        }
      }

      return processes;
    } catch (error) {
      console.error('Failed to get Windows processes:', error);
      return [];
    }
  }

  /**
   * Get macOS processes using ps
   */
  private async getMacOSProcesses(): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync('ps -axo pid,comm,command');
      const lines = stdout.split('\n').slice(1); // Skip header
      const processes: ProcessInfo[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        const match = line.trim().match(/^(\d+)\s+(.+?)\s+(.+)$/);
        if (match) {
          const [, pidStr, comm, command] = match;
          processes.push({
            pid: parseInt(pidStr),
            name: path.basename(comm),
            command: command,
            path: comm
          });
        }
      }

      return processes;
    } catch (error) {
      console.error('Failed to get macOS processes:', error);
      return [];
    }
  }

  /**
   * Get Linux processes using ps
   */
  private async getLinuxProcesses(): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync('ps -eo pid,comm,cmd --no-headers');
      const lines = stdout.split('\n');
      const processes: ProcessInfo[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        const match = line.trim().match(/^(\d+)\s+(.+?)\s+(.+)$/);
        if (match) {
          const [, pidStr, comm, cmd] = match;
          processes.push({
            pid: parseInt(pidStr),
            name: comm,
            command: cmd,
            path: comm
          });
        }
      }

      return processes;
    } catch (error) {
      console.error('Failed to get Linux processes:', error);
      return [];
    }
  }

  /**
   * Terminate a process
   */
  private async terminateProcess(process: ProcessInfo): Promise<void> {
    switch (this.platform) {
      case Platform.WINDOWS:
        await execAsync(`taskkill /PID ${process.pid} /F`);
        break;
      case Platform.MACOS:
      case Platform.LINUX:
        await execAsync(`kill -9 ${process.pid}`);
        break;
    }
  }

  /**
   * Forcefully kill a process tree
   */
  async killProcessTree(pid: number): Promise<void> {
    try {
      switch (this.platform) {
        case Platform.WINDOWS:
          await execAsync(`taskkill /PID ${pid} /T /F`);
          break;
        case Platform.MACOS:
        case Platform.LINUX:
          // Kill process group
          await execAsync(`pkill -TERM -P ${pid}`);
          // Wait a moment then force kill
          setTimeout(async () => {
            try {
              await execAsync(`pkill -KILL -P ${pid}`);
              await execAsync(`kill -9 ${pid}`);
            } catch {
              // Process may already be dead
            }
          }, 2000);
          break;
      }
    } catch (error) {
      console.error(`Failed to kill process tree ${pid}:`, error);
      throw error;
    }
  }

  /**
   * Check if a specific process is running
   */
  async isProcessRunning(processName: string): Promise<boolean> {
    const processes = await this.getRunningProcesses();
    return processes.some(p => 
      p.name.toLowerCase() === processName.toLowerCase() ||
      path.basename(p.name.toLowerCase(), path.extname(p.name)) === processName.toLowerCase()
    );
  }

  /**
   * Get process info by PID
   */
  async getProcessInfo(pid: number): Promise<ProcessInfo | null> {
    const processes = await this.getRunningProcesses();
    return processes.find(p => p.pid === pid) || null;
  }

  /**
   * Clean up old termination history
   */
  private cleanupTerminationHistory(currentTime: number): void {
    const cutoffTime = currentTime - (this.COOLDOWN_MS * 2);
    
    for (const [pid, timestamp] of this.terminatedProcesses.entries()) {
      if (timestamp < cutoffTime) {
        this.terminatedProcesses.delete(pid);
      }
    }
  }

  /**
   * Parse CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      fields.push(current);
    }
    
    return fields;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    blockedProcessCount: number;
    terminatedCount: number;
    lastCheck: Date | null;
  } {
    return {
      isMonitoring: this.monitoringInterval !== null,
      blockedProcessCount: this.blockedProcesses.size,
      terminatedCount: this.terminatedProcesses.size,
      lastCheck: this.monitoringInterval ? new Date() : null
    };
  }

  /**
   * Cleanup and stop monitoring
   */
  async cleanup(): Promise<void> {
    this.stopMonitoring();
    this.blockedProcesses.clear();
    this.terminatedProcesses.clear();
  }
} 