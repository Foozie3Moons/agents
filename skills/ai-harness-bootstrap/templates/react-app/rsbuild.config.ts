import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  // React Compiler owns memoization; do not hand-write useMemo/useCallback (frontend.md §Memoization).
  plugins: [pluginReact({ reactCompiler: true })],
  source: { entry: { index: './src/main.tsx' } },
  html: { title: 'App' },
  output: { distPath: { root: 'dist' } },
  server: {
    port: 5173,
    // The frontend talks to the BFF over HTTP only; src/shared/ holds the few constants both sides need.
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
});
