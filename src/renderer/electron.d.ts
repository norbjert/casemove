export {};

interface ElectronAPI {
  refreshInventory: () => Promise<void>;

  handleWindowsActions: (whichOption: string) => Promise<void>;

  logUserOut: () => Promise<void>;

  retryConnection: () => Promise<void>;

  needUpdate: () => Promise<boolean>;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: ElectronAPI;
    };
  }
}
