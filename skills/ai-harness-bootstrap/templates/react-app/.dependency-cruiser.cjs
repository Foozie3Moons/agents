/** @type {import('dependency-cruiser').IConfiguration} */
// Frontend layer edges (.claude/rules/frontend.md): routes → pages → logicalComponents → molecules.
// Containers (logicalComponents) fetch through api/; molecules render props and import nothing stateful.
const TEST = '\\.(test|spec|stories)\\.(ts|tsx)$';

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true, viaOnly: { dependencyTypesNot: ['type-only'] } },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', TEST, '^src/main\\.tsx$'] },
      to: {},
    },
    {
      name: 'only-routes-import-pages',
      severity: 'error',
      from: { path: '^src/', pathNot: ['^src/routes\\.tsx$', '^src/pages/', TEST] },
      to: { path: '^src/pages/' },
    },
    {
      name: 'nothing-imports-main',
      severity: 'error',
      from: {},
      to: { path: '^src/main\\.tsx$' },
    },
    {
      name: 'molecules-are-presentational',
      severity: 'error',
      comment: 'Molecules render props. No api/, no containers, no pages, no providers.',
      from: { path: '^src/molecules/', pathNot: TEST },
      to: { path: '^src/(api|logicalComponents|pages|layouts|providers|routes)' },
    },
    {
      name: 'containers-do-not-import-pages-or-layouts',
      severity: 'error',
      from: { path: '^src/logicalComponents/', pathNot: TEST },
      to: { path: '^src/(pages|layouts|providers|routes)' },
    },
    {
      name: 'api-is-leaf',
      severity: 'error',
      comment: 'api/ holds hooks and the http client; it knows nothing about components.',
      from: { path: '^src/api/', pathNot: TEST },
      to: { path: '^src/(pages|layouts|logicalComponents|molecules|providers|routes)' },
    },
    {
      name: 'no-server-code',
      severity: 'error',
      comment: 'The frontend talks to the BFF over HTTP. Shared constants live in src/shared/.',
      from: { path: '^src/' },
      to: { path: '^(\\.\\./)+(src/)?(backend|backend-for-frontend)/' },
    },
    { name: 'no-test-imports-in-source', severity: 'error', from: { pathNot: TEST }, to: { path: TEST } },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true, pathNot: '^virtual:' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['node_modules', '^dist/', '^public/', '\\.css$'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types', 'browser'],
      extensions: ['.ts', '.tsx', '.js', '.cjs', '.mjs', '.d.ts'],
      mainFields: ['module', 'main', 'types', 'typings', 'browser'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: '^src/[^/]+',
        theme: { graph: { rankdir: 'LR', splines: 'ortho' } },
      },
    },
  },
};
