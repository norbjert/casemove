// Smoke test: verify the App module can be imported without throwing.
import App from 'renderer/App';

describe('App module', () => {
  it('is defined', () => {
    expect(App).toBeDefined();
  });
});
