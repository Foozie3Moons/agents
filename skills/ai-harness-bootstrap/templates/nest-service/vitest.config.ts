import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  // unplugin-swc emits emitDecoratorMetadata, matching tsx (the prod runner).
  // Vitest's default esbuild does not, so Nest would see no-arg constructors
  // and a missing @Inject() would pass tests and fail at boot.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'migrations/**/*.test.ts'],
  },
});
