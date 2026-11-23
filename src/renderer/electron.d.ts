export {};

interface ElectronAPI {
  refreshInventory: () => Promise<void>;

  handleWindowsActions: (whichOption: string) => Promise<void>;

  logUserOut: () => Promise<void>;

  retryConnection: () => Promise<void>;

  needUpdate: () => Promise<boolean>;

  getPortfolioHistory: (
    names: string[],
    from: string,
    to: string
  ) => Promise<{ history?: Record<string, any[]>; error?: string }>;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: ElectronAPI;
    };
  }
}
