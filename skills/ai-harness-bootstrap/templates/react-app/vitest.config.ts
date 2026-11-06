import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // RTL registers auto-cleanup only when a global afterEach exists; with
    // globals: false that silently fails, so the setup file does it explicitly.
    setupFiles: ['./src/vitest.setup.ts'],
  },
});
