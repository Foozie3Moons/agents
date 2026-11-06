// Frontend ESLint config. Structural rules from .claude/rules/frontend.md:
//   1. React Query hooks only in src/api/use*.ts; components call those hooks.
//   2. No barrels except logicalComponents/<Name>/index.tsx.
//   3. logicalComponents are imported through their index.tsx only.
//   4. QueryClient constructed only in src/providers/.
//   5. Router constructors only in src/routes.tsx and src/main.tsx.
//   6. fetch / XMLHttpRequest only in src/api/httpClient.ts.
//   7. No JSX style={} except CSS custom-property keys (--*).
// lint:css (package.json) bans the generic class names. dependency-cruiser owns
// the layer edges (pages → logicalComponents → molecules).
const tseslint = require('typescript-eslint');
const eslint = require('@eslint/js');
const reactHooks = require('eslint-plugin-react-hooks');

const NETWORK_BANS = [
  {
    selector: "CallExpression[callee.name='fetch']",
    message: 'Raw fetch() is forbidden outside src/api/httpClient.ts. Use an api/use*.ts hook.',
  },
  {
    selector: "NewExpression[callee.name='XMLHttpRequest']",
    message: 'Raw XMLHttpRequest is forbidden. Use src/api/httpClient.ts.',
  },
];

const IMPORT_BANS = [
  {
    name: '@tanstack/react-query',
    importNames: ['useQuery', 'useMutation', 'useInfiniteQuery', 'useQueries', 'useSuspenseQuery'],
    message: 'Data-fetching hooks live in src/api/use*.ts. Components call those hooks.',
  },
  {
    name: '@tanstack/react-query',
    importNames: ['QueryClientProvider', 'QueryClient'],
    message: 'QueryClient is constructed once, in src/providers/.',
  },
  {
    name: 'react-router-dom',
    importNames: ['HashRouter', 'BrowserRouter', 'createHashRouter', 'createBrowserRouter', 'RouterProvider'],
    message: 'Router constructors only in src/routes.tsx and src/main.tsx.',
  },
  { name: 'swr', message: 'Not used. Build on @tanstack/react-query in src/api/use*.ts.' },
  { name: 'axios', message: 'Not used. Go through src/api/httpClient.ts.' },
];

const DEEP_IMPORT_BANS = [
  {
    regex: 'logicalComponents/[^/]+/(?!index(\\.js|\\.tsx)?$).+',
    message: 'Import logicalComponents through <Name>/index.tsx only.',
  },
];

const INLINE_STYLE_BANS = [
  {
    selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > Property[key.type='Literal']:not([key.value=/^--/])",
    message: 'JSX style={} is banned except for CSS custom-property keys (--*). Use a .module.css class, :disabled / data-* for state, a custom property for measured values.',
  },
  {
    selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression > Property[key.type='Identifier']",
    message: 'JSX style={} is banned except for CSS custom-property keys (--*). Move static styles to the sibling .module.css.',
  },
];

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'storybook-static/**', '.storybook/**', 'eslint.config.cjs', '.dependency-cruiser.cjs', 'vite.config.ts', 'vitest.config.ts'],
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
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-restricted-imports': ['error', { paths: IMPORT_BANS, patterns: DEEP_IMPORT_BANS }],
      'no-restricted-syntax': ['error', ...NETWORK_BANS],
    },
  },
  {
    // Inside a container directory, its own internals are importable. Options do
    // not merge across blocks, so the paths bans are repeated here.
    files: ['src/logicalComponents/*/**'],
    rules: { 'no-restricted-imports': ['error', { paths: IMPORT_BANS }] },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'],
    rules: {
      // Re-declare the network bans: this narrower block replaces, not merges, the rule's options.
      'no-restricted-syntax': ['error', ...NETWORK_BANS, ...INLINE_STYLE_BANS],
    },
  },
  // ─── allowlists ──────────────────────────────────────────────────────────
  {
    files: ['src/api/use*.ts', 'src/api/httpClient.ts'],
    rules: { 'no-restricted-imports': 'off', 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/providers/**', 'src/routes.tsx', 'src/main.tsx', 'src/**/*.test.{ts,tsx}', 'src/vitest.setup.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: { 'no-console': 'off' },
  },
  // ─── barrels ─────────────────────────────────────────────────────────────
  {
    files: ['src/**/index.ts', 'src/**/index.tsx'],
    ignores: ['src/logicalComponents/**/index.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...NETWORK_BANS,
        { selector: 'ExportAllDeclaration', message: 'Barrel re-exports are forbidden. The only barrel is logicalComponents/<Name>/index.tsx.' },
        { selector: 'ExportNamedDeclaration[source]', message: 'Barrel re-exports are forbidden. The only barrel is logicalComponents/<Name>/index.tsx.' },
      ],
    },
  },
);
