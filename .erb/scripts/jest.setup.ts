// Polyfill fetch for Jest (not available in jsdom by default)
global.fetch = (() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })) as any;

// Mock Electron's ipcRenderer bridge (not available in jsdom).
// Uses a Proxy so any method access returns a jest.fn() automatically.
Object.defineProperty(window, 'electron', {
  writable: true,
  value: {
    ipcRenderer: new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === 'on' || prop === 'once') {
            return jest.fn((_channel: string, _callback: Function) => {});
          }
          return jest.fn(() => Promise.resolve());
        },
      }
    ),
  },
});
