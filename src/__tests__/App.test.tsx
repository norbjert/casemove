// Smoke test: verify the App module and its key dependencies can be imported
// without errors. Full render testing requires a real Electron environment.

describe('App module', () => {
  it('imports without throwing', () => {
    expect(() => require('../renderer/App')).not.toThrow();
  });
});
