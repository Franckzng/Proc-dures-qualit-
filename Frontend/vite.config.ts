import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 0,         // désactive le timeout côté proxy
        proxyTimeout: 0,     // idem pour le proxy lui-même

        // rewrite garde le même chemin côté backend
        rewrite: (path) => path,
      },
    },
  },
});
