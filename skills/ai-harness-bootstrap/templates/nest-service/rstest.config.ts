import { defineConfig } from '@rstest/core';

// Legacy decorators turn on SWC's decoratorMetadata, so design:paramtypes is
// emitted exactly as tsx does in prod. Without it a missing @Inject() passes
// tests and fails at boot. src/backend/core/di-metadata.test.ts checks this.
export default defineConfig({
  include: ['src/**/*.test.ts', 'migrations/**/*.test.ts'],
  exclude: ['**/node_modules/**', '**/dist/**', 'src/frontend/**'],
  source: { decorators: { version: 'legacy' } },
  passWithNoTests: true,
});
