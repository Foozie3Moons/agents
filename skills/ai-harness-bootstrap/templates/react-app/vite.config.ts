import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    port: 5173,
    // The frontend talks to the BFF over HTTP only; src/shared/ holds the few constants both sides need.
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
});
