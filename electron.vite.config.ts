import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Electron loads the renderer via file://, and crossorigin attributes on
// <script type="module"> and <link> tags break loading under that protocol.
function removeCrossOriginPlugin() {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html: string) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    resolve: {
      alias: {
        shared: resolve('src/shared'),
        main: resolve('src/main'),
      },
    },
    build: {
      outDir: 'out/main',
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: resolve('src/main/preload.js'),
        external: ['electron', 'bytebuffer'],
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
        },
      },
    },
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        renderer: resolve('src/renderer'),
        shared: resolve('src/shared'),
      },
    },
    plugins: [react(), tailwindcss(), removeCrossOriginPlugin()],
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: resolve('src/renderer/index.html'),
      },
    },
  },
});
