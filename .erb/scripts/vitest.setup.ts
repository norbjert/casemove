import '@testing-library/jest-dom';

// Polyfill fetch for vitest/jsdom
global.fetch = (() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })) as any;

// Mock Electron's ipcRenderer bridge (not available in jsdom).
// Uses a Proxy so any method access returns a vi.fn() automatically.
Object.defineProperty(window, 'electron', {
  writable: true,
  value: {
    ipcRenderer: new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === 'on' || prop === 'once') {
            return vi.fn((_channel: string, _callback: Function) => {});
          }
          return vi.fn(() => Promise.resolve());
        },
      }
    ),
  },
});
