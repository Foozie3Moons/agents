import { withRsbuildConfig } from '@rstest/adapter-rsbuild';
import { defineConfig } from '@rstest/core';

// Reuses rsbuild.config.ts (plugins, CSS Modules, aliases) so tests compile the
// same way the app does. Config options are a mix of src/.. patterns; see rstest.rs.
export default defineConfig({
  extends: withRsbuildConfig(),
  testEnvironment: 'jsdom',
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  setupFiles: ['./rstest.setup.ts'],
  passWithNoTests: true,
});
