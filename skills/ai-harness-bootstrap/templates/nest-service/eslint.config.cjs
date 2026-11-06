// Backend ESLint config: common rules, vendor-SDK import fences, custom rules
// in eslint-rules/, and layer edges via eslint-plugin-boundaries.
// dependency-cruiser (.dependency-cruiser.cjs) owns the graph-level rules.
const tseslint = require('typescript-eslint');
const eslint = require('@eslint/js');
const boundaries = require('eslint-plugin-boundaries');
const requireInjectDecorator = require('./eslint-rules/require-inject-decorator.cjs');
const noGenericRepository = require('./eslint-rules/no-generic-repository.cjs');
const noProcessEnvOutsideConfig = require('./eslint-rules/no-process-env-outside-config.cjs');
const noInterpolatedSql = require('./eslint-rules/no-interpolated-sql.cjs');
const noCrossDomainWrites = require('./eslint-rules/no-cross-domain-writes.cjs');

// One entry per external system. The whole package, or `importNames` for the
// single egress function. Add the entry the same day the SDK lands in
// package.json, and add the gateway file to GATEWAY_FILES below.
const VENDOR_SDK_FENCES = [
  // {
  //   name: '@anthropic-ai/sdk',
  //   message: 'Inject the gateway from src/backend/llm/data-access/ instead.',
  // },
];
const GATEWAY_FILES = [
  // 'src/backend/llm/data-access/anthropic.gateway.ts',
];

const BACKEND = ['src/backend/**/*.ts', 'src/backend-for-frontend/**/*.ts'];

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'src/frontend/**', 'eslint-rules/**', 'eslint.config.cjs', '.dependency-cruiser.cjs', 'rstest.config.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-restricted-imports': ['error', {
        paths: [
          ...VENDOR_SDK_FENCES,
          {
            // @InjectPinoLogger needs per-module LoggerModule.forFeature and crashes
            // Nest at boot when forgotten. `new Logger(X.name)` from @nestjs/common is
            // routed to pino by app.useLogger() in main.ts.
            name: 'nestjs-pino',
            importNames: ['InjectPinoLogger', 'PinoLogger'],
            message: 'Use `Logger` from `@nestjs/common`. See .claude/rules/backend.md §Logger.',
          },
        ],
      }],
    },
  },
  {
    files: [...GATEWAY_FILES, 'src/backend/core/logging/**', 'src/backend/main.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.test.ts', 'scripts/**'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/index.ts'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'ExportAllDeclaration',
        message: 'Barrel re-exports (export * from) are forbidden. Import from source files directly.',
      }],
    },
  },
  // ─── custom rules (eslint-rules/*.cjs) ───────────────────────────────────
  {
    files: BACKEND,
    ignores: ['**/*.test.ts'],
    plugins: {
      local: {
        rules: {
          'require-inject-decorator': requireInjectDecorator,
          'no-generic-repository': noGenericRepository,
          'no-process-env-outside-config': noProcessEnvOutsideConfig,
          'no-interpolated-sql': noInterpolatedSql,
          'no-cross-domain-writes': noCrossDomainWrites,
        },
      },
    },
    rules: {
      'local/require-inject-decorator': 'error',
      'local/no-generic-repository': 'error',
      'local/no-process-env-outside-config': 'error',
      'local/no-interpolated-sql': 'error',
      // No-op until the repo has src/backend/domains/<name>/.
      'local/no-cross-domain-writes': 'error',
    },
  },
  // ─── layer edges (eslint-plugin-boundaries) ──────────────────────────────
  // Per-file enforcement of .claude/rules/backend.md §3.6–§3.8. dependency-cruiser
  // repeats the same edges on the whole graph so a misconfiguration here cannot
  // silently open a hole.
  {
    files: BACKEND,
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true, project: './tsconfig.json' } },
      'boundaries/elements': [
        // core-types before core so the more specific glob wins.
        { type: 'core-types', pattern: 'src/backend/core/types/**' },
        { type: 'core', pattern: 'src/backend/core/**' },
        { type: 'transport', pattern: 'src/backend/transport/**' },
        { type: 'module-api', pattern: ['src/backend/*/api/**', 'src/backend/domains/*/api/**'] },
        { type: 'module-use-case', pattern: ['src/backend/*/use-case/**', 'src/backend/domains/*/use-case/**'] },
        { type: 'module-application', pattern: ['src/backend/*/application/**', 'src/backend/domains/*/application/**'] },
        { type: 'module-domain', pattern: ['src/backend/*/domain/**', 'src/backend/domains/*/domain/**'] },
        { type: 'module-data-access', pattern: ['src/backend/*/data-access/**', 'src/backend/domains/*/data-access/**'] },
        { type: 'bff-api', pattern: 'src/backend-for-frontend/*/api/**' },
        { type: 'bff-use-case', pattern: 'src/backend-for-frontend/*/use-case/**' },
        { type: 'bff-application', pattern: 'src/backend-for-frontend/*/application/**' },
        { type: 'bff-domain', pattern: 'src/backend-for-frontend/*/domain/**' },
        { type: 'bff-data-access', pattern: 'src/backend-for-frontend/*/data-access/**' },
      ],
      'boundaries/ignore': ['src/shared/**', '**/*.test.ts'],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        rules: [
          { from: { type: 'core-types' }, allow: { to: { type: ['core-types'] } } },
          { from: { type: 'core' }, allow: { to: { type: ['core-types', 'core'] } } },
          { from: { type: 'transport' }, allow: { to: { type: ['module-api', 'core-types', 'core'] } } },
          { from: { type: 'module-api' }, allow: { to: { type: ['module-use-case', 'module-application', 'module-domain', 'core-types', 'core', 'module-api'] } } },
          { from: { type: 'module-use-case' }, allow: { to: { type: ['module-application', 'module-domain', 'core-types', 'core'] } } },
          { from: { type: 'module-application' }, allow: { to: { type: ['module-data-access', 'module-domain', 'core-types', 'core', 'module-application'] } } },
          { from: { type: 'module-data-access' }, allow: { to: { type: ['module-domain', 'core-types', 'core'] } } },
          { from: { type: 'module-domain' }, allow: { to: { type: ['core-types', 'module-domain'] } } },
          // BFF is downstream of the backend: it may consume backend use-case/,
          // application/ (behavior) and domain/ (types), never api/ or data-access/.
          { from: { type: 'bff-api' }, allow: { to: { type: ['bff-use-case', 'bff-application', 'bff-domain', 'core-types', 'core', 'module-use-case', 'module-application', 'module-domain', 'bff-api'] } } },
          { from: { type: 'bff-use-case' }, allow: { to: { type: ['bff-application', 'bff-domain', 'core-types', 'core', 'module-use-case', 'module-application', 'module-domain'] } } },
          { from: { type: 'bff-application' }, allow: { to: { type: ['bff-data-access', 'bff-domain', 'core-types', 'core', 'module-use-case', 'module-application', 'module-domain', 'bff-application'] } } },
          { from: { type: 'bff-data-access' }, allow: { to: { type: ['bff-domain', 'core-types', 'core', 'module-domain'] } } },
          { from: { type: 'bff-domain' }, allow: { to: { type: ['core-types', 'module-domain', 'bff-domain'] } } },
        ],
      }],
    },
  },
  {
    files: ['src/shared/**', '**/*.test.ts'],
    rules: { 'boundaries/dependencies': 'off' },
  },
);
