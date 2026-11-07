// Library ESLint config. Common rules only; the Nest-specific custom rules in
// eslint-rules/ are not wired here because a library has no DI container or SQL.
// If the package grows a SQL surface, wire eslint-rules/no-interpolated-sql.cjs
// (see the nest-service template for the shape).
const tseslint = require('typescript-eslint');
const eslint = require('@eslint/js');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'eslint.config.cjs', '.dependency-cruiser.cjs', 'rstest.config.ts', 'eslint-rules/**'] },
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
      // A library never reads the environment; the consumer passes config in.
      'no-restricted-properties': ['error', {
        object: 'process', property: 'env',
        message: 'Libraries do not read process.env. Accept config through the constructor or function argument.',
      }],
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // src/index.ts is the public API: named re-exports only, never `export *`.
    // Any other index.ts is a barrel and is banned outright.
    files: ['**/index.ts'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'ExportAllDeclaration',
        message: 'export * is forbidden. List the public API as named exports.',
      }],
    },
  },
);
