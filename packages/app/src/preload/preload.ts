import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Service communication
  getServiceStatus: () => ipcRenderer.invoke('service:get-status'),
  getRules: () => ipcRenderer.invoke('service:get-rules'),
  createRule: (rule: any) => ipcRenderer.invoke('service:create-rule', rule),
  updateRule: (id: string, updates: any) => ipcRenderer.invoke('service:update-rule', id, updates),
  deleteRule: (id: string) => ipcRenderer.invoke('service:delete-rule', id),
  emergencyOverride: (ruleId: string, reason: string) => 
    ipcRenderer.invoke('service:emergency-override', ruleId, reason),
  getLogs: (options: any) => ipcRenderer.invoke('service:get-logs', options),

  // App configuration
  getAppConfig: () => ipcRenderer.invoke('app:get-config'),
  setAppConfig: (config: any) => ipcRenderer.invoke('app:set-config', config),

  // Window management
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleDevTools: () => ipcRenderer.invoke('window:toggle-devtools'),

  // File operations
  showSaveDialog: (options: any) => ipcRenderer.invoke('file:show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('file:show-open-dialog', options),

  // Notifications
  showNotification: (title: string, body: string) => 
    ipcRenderer.invoke('notification:show', title, body),

  // Event listeners
  onServiceStatusChanged: (callback: (isRunning: boolean) => void) => 
    ipcRenderer.on('service-status-changed', (_, isRunning) => callback(isRunning)),
  onNavigateTo: (callback: (route: string) => void) => 
    ipcRenderer.on('navigate-to', (_, route) => callback(route)),

  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
}); 