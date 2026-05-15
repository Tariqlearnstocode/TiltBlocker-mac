declare global {
  interface Window {
    electronAPI?: {
      showMainWindow: (showLockoutModal?: boolean) => Promise<void>;
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      toggleDevTools: () => Promise<void>;
      getServiceStatus: () => Promise<any>;
      getRules: () => Promise<any>;
      createRule: (rule: any) => Promise<any>;
      updateRule: (id: string, updates: any) => Promise<any>;
      deleteRule: (id: string) => Promise<any>;
      emergencyOverride: (ruleId: string, reason: string) => Promise<any>;
      getLogs: (options: any) => Promise<any>;
      getAppConfig: () => Promise<any>;
      setAppConfig: (config: any) => Promise<any>;
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      showNotification: (title: string, body: string) => Promise<void>;
      onServiceStatusChanged: (callback: (isRunning: boolean) => void) => void;
      onNavigateTo: (callback: (route: string) => void) => void;
      onShowLockoutModal: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {};

