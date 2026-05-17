import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./scripts/vitest.setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      renderer: resolve(__dirname, 'src/renderer'),
      shared: resolve(__dirname, 'src/shared'),
      main: resolve(__dirname, 'src/main'),
    },
  },
});
