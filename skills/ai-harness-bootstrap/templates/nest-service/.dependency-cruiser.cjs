/** @type {import('dependency-cruiser').IConfiguration} */
// Second enforcement layer beside eslint-plugin-boundaries (eslint.config.cjs).
// ESLint checks one file at a time; dependency-cruiser sees the whole graph, so
// it owns cycles, orphans, and tree-level edges, and repeats the layer edges so
// the two reports agree. Layer vocabulary: .claude/rules/backend.md.
const TEST = '\\.(test|spec|stories)\\.(ts|tsx)$';

module.exports = {
  forbidden: [
    // ── Graph-level ───────────────────────────────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Nest resolves providers at class-declaration time; a cycle becomes an undefined provider at boot.',
      from: {},
      to: { circular: true, viaOnly: { dependencyTypesNot: ['type-only'] } },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'A source file nothing imports is dead or mis-wired.',
      from: {
        orphan: true,
        pathNot: ['\\.d\\.ts$', TEST, '^src/backend/main\\.ts$', '\\.module\\.ts$', '^src/frontend/src/(main\\.tsx|vitest\\.setup\\.ts)$', '^src/frontend/(\\.storybook/|.*\\.config\\.(ts|cjs)$|\\.dependency-cruiser\\.cjs$)'],
      },
      to: {},
    },

    // ── Cross-tree (backend.md §3.8) ──────────────────────────────────────
    {
      name: 'backend-must-not-import-bff',
      severity: 'error',
      comment: 'Only the composition root (app.module.ts) wires the BFF in.',
      from: { path: '^src/backend/', pathNot: ['^src/backend/app\\.module', TEST] },
      to: { path: '^src/backend-for-frontend/' },
    },
    {
      name: 'frontend-must-not-import-server-code',
      severity: 'error',
      comment: 'The frontend talks to the BFF over HTTP. Shared constants live in src/shared/.',
      from: { path: '^src/frontend/' },
      to: { path: '^src/(backend|backend-for-frontend)/' },
    },
    {
      name: 'server-must-not-import-frontend',
      severity: 'error',
      from: { path: '^src/(backend|backend-for-frontend)/' },
      to: { path: '^src/frontend/' },
    },
    {
      name: 'bff-must-not-reach-backend-api-or-data-access',
      severity: 'error',
      comment: '§3.8: BFF consumes backend use-case/, application/, and domain/ (types) only.',
      from: { path: '^src/backend-for-frontend/', pathNot: TEST },
      to: { path: '^src/backend/[^/]+/(api|data-access)/' },
    },

    // ── Top-level concepts (§4) ───────────────────────────────────────────
    {
      name: 'core-must-not-import-modules',
      severity: 'error',
      comment: '§4.2: core/ is imported by everything and imports nothing from modules, transport, or BFF.',
      from: { path: '^src/backend/core/' },
      to: { path: '^src/(backend/(?!core/)|backend-for-frontend/|frontend/)' },
    },
    {
      name: 'transport-must-not-import-module-internals',
      severity: 'error',
      comment: '§4.1: transports dispatch into api/ and may import core/ only.',
      from: { path: '^src/backend/transport/' },
      to: { path: '^src/backend/(?!core/|transport/)[^/]+/(use-case|application|data-access|domain)/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'modules-must-not-import-transport',
      severity: 'error',
      comment: 'Only the composition root (main.ts, app.module.ts) may wire a transport in.',
      from: { path: '^src/backend/(?!transport/)', pathNot: ['^src/backend/(main|app\\.module)', TEST] },
      to: { path: '^src/backend/transport/' },
    },

    // ── Intra-module layer direction (§3.6) ───────────────────────────────
    {
      name: 'domain-imports-only-core-types',
      severity: 'error',
      from: { path: '/domain/', pathNot: TEST },
      to: { path: '^src/backend', pathNot: ['/domain/', '^src/backend/core/types/', '^src/shared/'], dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'data-access-imports-domain-or-core-only',
      severity: 'error',
      from: { path: '/data-access/', pathNot: TEST },
      to: { path: '^src/backend', pathNot: ['/domain/', '/data-access/', '^src/backend/core/', '^src/shared/'], dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'application-must-not-import-api-or-use-case',
      severity: 'error',
      comment: 'Within one tree. BFF application may consume backend use-cases (§3.8).',
      from: { path: '^src/(backend|backend-for-frontend)/.*/application/', pathNot: TEST },
      to: { path: '^src/$1/.*/(api|use-case)/' },
    },
    {
      name: 'api-must-not-skip-to-data-access',
      severity: 'error',
      comment: 'No layer skipping: api/ reaches data-access/ through application/ even when the service is a one-line passthrough.',
      from: { path: '/api/', pathNot: TEST },
      to: { path: '/data-access/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'use-case-must-not-import-api-or-data-access',
      severity: 'error',
      from: { path: '/use-case/', pathNot: TEST },
      to: { path: '/(api|data-access)/', dependencyTypesNot: ['type-only'] },
    },

    // ── Cross-module (§3.7) ───────────────────────────────────────────────
    {
      name: 'no-foreign-api-use-case-or-data-access',
      severity: 'error',
      comment: 'Another module is opaque except through application/ (behavior) and domain/ (types).',
      from: { path: '^src/backend/(?!core/)([^/]+)/', pathNot: TEST },
      to: { path: '^src/backend/(?!core/)([^/]+)/(api|use-case|data-access)/', pathNot: '^src/backend/(?!core/)$1/' },
    },
    {
      name: 'domains-no-foreign-domain-data-access',
      severity: 'error',
      comment: 'A domain under src/backend/domains/ never touches another domain\'s tables. No-op until that directory exists.',
      from: { path: '^src/backend/domains/([^/]+)/', pathNot: TEST },
      to: { path: '^src/backend/domains/([^/]+)/data-access/', pathNot: '^src/backend/domains/$1/' },
    },

    // ── Hygiene ───────────────────────────────────────────────────────────
    { name: 'no-test-imports-in-source', severity: 'error', from: { pathNot: TEST }, to: { path: TEST } },
    {
      name: 'no-deprecated-core-packages',
      severity: 'warn',
      from: {},
      to: { dependencyTypes: ['core'], path: '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$' },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Vite virtual modules are resolved by the bundler, not the filesystem.',
      from: {},
      to: { couldNotResolve: true, pathNot: '^virtual:' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['node_modules', '(^|/)dist/', '^src/frontend/(public|storybook-static)/'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.cjs', '.mjs', '.d.ts'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: '^src/(backend|backend-for-frontend)/[^/]+/[^/]+|^src/frontend/src/[^/]+',
        theme: {
          graph: { rankdir: 'LR', splines: 'ortho' },
          modules: [
            { criteria: { source: '^src/backend/core' }, attributes: { fillcolor: '#ffe9c6' } },
            { criteria: { source: '^src/backend/' }, attributes: { fillcolor: '#d6e9ff' } },
            { criteria: { source: '^src/backend-for-frontend/' }, attributes: { fillcolor: '#e3ffd6' } },
            { criteria: { source: '^src/frontend/' }, attributes: { fillcolor: '#f3d6ff' } },
          ],
        },
      },
    },
  },
};
