/** @type {import('dependency-cruiser').IConfiguration} */
// Graph-level checks ESLint cannot do: cycles, orphans, entry-point discipline.
const TEST = '\\.(test|spec)\\.ts$';

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
      comment: 'A source file nothing imports is dead or not yet exported from src/index.ts.',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', TEST, '^src/index\\.ts$'] },
      to: {},
    },
    {
      name: 'index-is-not-imported-internally',
      severity: 'error',
      comment: 'src/index.ts is the consumer-facing entry. Internal files import the source file, not the entry.',
      from: { path: '^src/', pathNot: '^src/index\\.ts$' },
      to: { path: '^src/index\\.ts$' },
    },
    {
      name: 'no-test-imports-in-source',
      severity: 'error',
      from: { pathNot: TEST },
      to: { path: TEST },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-deprecated-core-packages',
      severity: 'warn',
      from: {},
      to: { dependencyTypes: ['core'], path: '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['node_modules', '^dist/'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.js', '.cjs', '.mjs', '.d.ts'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      dot: { theme: { graph: { rankdir: 'LR', splines: 'ortho' } } },
    },
  },
};
