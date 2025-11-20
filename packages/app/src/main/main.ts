import { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

interface AppConfig {
  windowBounds?: Electron.Rectangle;
  minimizeToTray: boolean;
  startMinimized: boolean;
  serviceUrl: string;
  autoStart: boolean;
}

export class TraderBlockApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private store: Store<AppConfig>;
  private isDev = process.env.NODE_ENV === 'development';
  private serviceHealthTimer: NodeJS.Timeout | null = null;
  private isServiceRunning = false;

  constructor() {
    this.store = new Store<AppConfig>({
      defaults: {
        minimizeToTray: true,
        startMinimized: false,
        serviceUrl: 'http://localhost:3001',
        autoStart: true
      }
    });

    this.initializeApp();
  }

  private initializeApp(): void {
    // Single instance lock
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      this.showMainWindow();
    });

    // App event handlers
    app.whenReady().then(() => {
      this.createMainWindow();
      this.createTray();
      this.setupIpcHandlers();
      this.startServiceHealthCheck();
      
      if (this.isDev) {
        this.setupDevEnvironment();
      } else {
        this.setupAutoUpdater();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('before-quit', (event) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.store.set('windowBounds', this.mainWindow.getBounds());
      }
      this.cleanup();
    });
  }

  private createMainWindow(): void {
    const bounds = this.store.get('windowBounds');
    
    this.mainWindow = new BrowserWindow({
      width: bounds?.width || 700,
      height: bounds?.height || 600,
      minWidth: 600,
      minHeight: 500,
      x: bounds?.x,
      y: bounds?.y,
      title: 'TraderBlock Settings',
      icon: this.getAppIcon(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: !this.isDev
      },
      show: !this.store.get('startMinimized'),
      minimizable: true,
      closable: true,
      resizable: true,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Load the app
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Window event handlers
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('minimize', () => {
      if (this.store.get('minimizeToTray')) {
        this.mainWindow?.hide();
      }
    });

    this.mainWindow.on('close', (event) => {
      if (this.store.get('minimizeToTray') && !(app as any).isQuiting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private createTray(): void {
    const trayIcon = this.getTrayIcon();
    this.tray = new Tray(trayIcon);

    this.updateTrayMenu();
    
    this.tray.setToolTip('Trader Browser Block');
    
    this.tray.on('click', () => {
      this.toggleMainWindow();
    });

    this.tray.on('double-click', () => {
      this.showMainWindow();
    });
  }

  private updateTrayMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Trader Browser Block',
        type: 'normal',
        enabled: false
      },
      { type: 'separator' },
      {
        label: `Service: ${this.isServiceRunning ? 'Running' : 'Stopped'}`,
        type: 'normal',
        enabled: false,
        icon: this.isServiceRunning ? 
          nativeImage.createFromPath(path.join(__dirname, '../assets/status-online.png')).resize({ width: 16 }) :
          nativeImage.createFromPath(path.join(__dirname, '../assets/status-offline.png')).resize({ width: 16 })
      },
      { type: 'separator' },
      {
        label: 'Show Dashboard',
        type: 'normal',
        click: () => this.showMainWindow()
      },
      {
        label: 'Emergency Override',
        type: 'normal',
        click: () => this.showEmergencyOverride()
      },
      { type: 'separator' },
      {
        label: 'Settings',
        type: 'normal',
        click: () => this.showSettings()
      },
      {
        label: 'View Logs',
        type: 'normal',
        click: () => this.showLogs()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        type: 'normal',
        role: 'quit'
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setupIpcHandlers(): void {
    // Service communication
    ipcMain.handle('service:get-status', async () => {
      return this.getServiceStatus();
    });

    ipcMain.handle('service:get-rules', async () => {
      return this.makeServiceRequest('/api/rules');
    });

    ipcMain.handle('service:create-rule', async (event, rule) => {
      return this.makeServiceRequest('/api/rules', 'POST', rule);
    });

    ipcMain.handle('service:update-rule', async (event, id, updates) => {
      return this.makeServiceRequest(`/api/rules/${id}`, 'PUT', updates);
    });

    ipcMain.handle('service:delete-rule', async (event, id) => {
      return this.makeServiceRequest(`/api/rules/${id}`, 'DELETE');
    });

    ipcMain.handle('service:emergency-override', async (event, ruleId, reason) => {
      return this.makeServiceRequest(`/api/emergency-override/${ruleId}`, 'POST', { reason });
    });

    ipcMain.handle('service:get-logs', async (event, options) => {
      const params = new URLSearchParams(options);
      return this.makeServiceRequest(`/api/logs?${params}`);
    });

    // App configuration
    ipcMain.handle('app:get-config', () => {
      return this.store.store;
    });

    ipcMain.handle('app:set-config', (event, config) => {
      Object.assign(this.store.store, config);
      return true;
    });

    // Window management
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });

    ipcMain.handle('window:toggle-devtools', () => {
      this.mainWindow?.webContents.toggleDevTools();
    });

    // File operations
    ipcMain.handle('file:show-save-dialog', async (event, options) => {
      if (!this.mainWindow) return null;
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result;
    });

    ipcMain.handle('file:show-open-dialog', async (event, options) => {
      if (!this.mainWindow) return null;
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });

    // Notifications
    ipcMain.handle('notification:show', (event, title, body) => {
      if (this.tray) {
        this.tray.displayBalloon({
          title,
          content: body,
          icon: this.getAppIcon()
        });
      }
    });
  }

  private async makeServiceRequest(endpoint: string, method = 'GET', data?: any): Promise<any> {
    try {
      const url = `${this.store.get('serviceUrl')}${endpoint}`;
      const response = await axios({
        url,
        method,
        data,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Service request failed:', error);
      throw error;
    }
  }

  private async getServiceStatus(): Promise<any> {
    try {
      const status = await this.makeServiceRequest('/health');
      this.isServiceRunning = true;
      return status;
    } catch (error) {
      this.isServiceRunning = false;
      throw error;
    }
  }

  private startServiceHealthCheck(): void {
    this.serviceHealthTimer = setInterval(async () => {
      try {
        await this.getServiceStatus();
        if (!this.isServiceRunning) {
          this.isServiceRunning = true;
          this.updateTrayMenu();
          this.notifyServiceStatusChange(true);
        }
      } catch (error) {
        if (this.isServiceRunning) {
          this.isServiceRunning = false;
          this.updateTrayMenu();
          this.notifyServiceStatusChange(false);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  private notifyServiceStatusChange(isRunning: boolean): void {
    if (this.tray) {
      this.tray.displayBalloon({
        title: 'Trader Browser Block',
        content: `Service is now ${isRunning ? 'running' : 'stopped'}`,
        icon: this.getAppIcon()
      });
    }

    // Send to renderer if window is open
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('service-status-changed', isRunning);
    }
  }

  private showMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    } else {
      this.createMainWindow();
    }
  }

  private toggleMainWindow(): void {
    if (this.mainWindow && this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showMainWindow();
    }
  }

  private showEmergencyOverride(): void {
    this.showMainWindow();
    // Send navigation event to renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('navigate-to', '/emergency');
    }
  }

  private showSettings(): void {
    this.showMainWindow();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('navigate-to', '/settings');
    }
  }

  private showLogs(): void {
    this.showMainWindow();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('navigate-to', '/logs');
    }
  }

  private getAppIcon(): Electron.NativeImage {
    const iconPath = process.platform === 'win32' ? 'icon.ico' : 
                    process.platform === 'darwin' ? 'icon.icns' : 'icon.png';
    return nativeImage.createFromPath(path.join(__dirname, '../assets', iconPath));
  }

  private getTrayIcon(): Electron.NativeImage {
    const iconName = process.platform === 'darwin' ? 'tray-icon-template.png' : 'tray-icon.png';
    return nativeImage.createFromPath(path.join(__dirname, '../assets', iconName));
  }

  private setupAutoUpdater(): void {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update available',
        message: 'A new version is available. It will be downloaded in the background.',
        buttons: ['OK']
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update ready',
        message: 'Update downloaded. The application will restart to apply the update.',
        buttons: ['Restart', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }

  private setupDevEnvironment(): void {
    // Install React DevTools in development
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
    
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name: string) => console.log(`Added Extension: ${name}`))
      .catch((err: any) => console.log('An error occurred: ', err));
  }

  private cleanup(): void {
    if (this.serviceHealthTimer) {
      clearInterval(this.serviceHealthTimer);
    }
  }
}

// Create app instance
const traderBlockApp = new TraderBlockApp(); 