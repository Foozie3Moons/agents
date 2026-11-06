# Anti-drift measures

Every guard, what it catches, where it lives, and which kinds carry it. A rule that only exists in a markdown file is advice; a rule an agent cannot violate without a red check is a guard. The list below is the guards. The rules files (`plugins/bff/rules/`) say *why*; this file says *how it is enforced*.

| Guard | Catches | Lives in | Kinds |
|---|---|---|---|
| `tsc --strict` + `noUncheckedIndexedAccess`, `noImplicitOverride` | implicit any, unchecked index access, accidental overrides | `tsconfig.json` | all |
| `verbatimModuleSyntax` / `consistent-type-imports` | value imports of types (breaks depcruise's `type-only` exemptions) | `tsconfig.json` (package), ESLint elsewhere | all |
| `no-console` | logging that bypasses pino | `eslint.config.cjs` | all |
| `no-explicit-any` | `any` leaking across boundaries | `eslint.config.cjs` | all |
| `export *` ban in `index.ts` | barrels (undefined Nest provider at boot) | `eslint.config.cjs` + PreToolUse hook | all |
| PreToolUse hook `guard-barrel-files.sh` | the same, at write time, before lint runs | `.claude/settings.json`, `.claude/scripts/` | all |
| `no-circular` | import cycles | `.dependency-cruiser.cjs` | all |
| `no-orphans` (warn) | dead or unwired files | `.dependency-cruiser.cjs` | all |
| `no-test-imports-in-source`, `not-to-unresolvable` | test code in prod, broken imports | `.dependency-cruiser.cjs` | all |
| `minimumReleaseAge: 10080` | a package version published less than a week ago (supply chain) | `pnpm-workspace.yaml` | all but package |
| `.tool-versions` + `setup-node` reading it | Node/pnpm drift between laptop and CI | `.tool-versions`, `ci.yml` | all |
| CI: build, lint, depcruise, test on every PR | everything above, enforced on the merge | `.github/workflows/ci.yml` | all |
| `no-restricted-properties process.env` | a library reading the environment | package `eslint.config.cjs` | package |
| `index-is-not-imported-internally` | internals importing the public entry | package `.dependency-cruiser.cjs` | package |
| `eslint-plugin-boundaries` element rules | per-file layer edges: api → use-case → application → data-access → domain; core/transport/BFF tables | `eslint.config.cjs` | nest-service, bff-app |
| depcruise layer rules (same edges, whole graph) | a boundaries misconfiguration opening a hole; layer skips (`api-must-not-skip-to-data-access`) | `.dependency-cruiser.cjs` | nest-service, bff-app |
| cross-tree rules | backend importing BFF, BFF reaching backend `api/` or `data-access/`, frontend importing server code | `.dependency-cruiser.cjs` | nest-service, bff-app |
| `local/require-inject-decorator` | constructor param without `@Inject()` (tsx emits primitive paramtypes, boot fails) | `eslint-rules/require-inject-decorator.cjs` | nest-service, bff-app |
| `local/no-generic-repository` | `implements Repository<T>` / generic CRUD surface | `eslint-rules/no-generic-repository.cjs` | nest-service, bff-app |
| `local/no-interpolated-sql` | `${}` inside `prepare()` / `exec()` SQL | `eslint-rules/no-interpolated-sql.cjs` | nest-service, bff-app |
| `local/no-process-env-outside-config` | env read anywhere but `core/config/` | `eslint-rules/no-process-env-outside-config.cjs` | nest-service, bff-app |
| `local/no-cross-domain-writes` | mutating call on another domain's service (only under `src/backend/domains/`) | `eslint-rules/no-cross-domain-writes.cjs` | nest-service, bff-app |
| `no-restricted-imports` vendor SDK fences | an SDK imported outside its gateway (bypasses redaction, usage recording) | `VENDOR_SDK_FENCES` + `GATEWAY_FILES` in `eslint.config.cjs` | nest-service, bff-app |
| `no-restricted-imports` nestjs-pino | `@InjectPinoLogger` (boot crash when `forFeature` is forgotten) | `eslint.config.cjs` | nest-service, bff-app |
| `unplugin-swc` in Vitest | tests that pass under esbuild but fail at boot because `design:paramtypes` was not emitted | `vitest.config.ts` | nest-service, bff-app |
| Zod config schema, fail-closed at boot | missing or malformed env discovered at request time | `core/config/config.schema.ts` | nest-service, bff-app |
| migrations append-only, tests seed from the same files | schema drift between prod and tests | `core/database/migration-runner.ts` | nest-service, bff-app |
| React Query hooks allowlist | `useQuery` in a component instead of `api/use*.ts` | frontend `eslint.config.cjs` | react-app, bff-app |
| `QueryClient` / router constructor allowlists | a second client, a second router | frontend `eslint.config.cjs` | react-app, bff-app |
| `fetch` / `XMLHttpRequest` / axios bans | network calls outside `api/httpClient.ts` | frontend `eslint.config.cjs` | react-app, bff-app |
| inline `style={}` ban (except `--*` keys) | styling outside CSS Modules | frontend `eslint.config.cjs` | react-app, bff-app |
| `lint:css` grep | generic class names (`.container`, `.wrapper`, `.box`, `.inner`, `.outer`) | frontend `package.json` | react-app, bff-app |
| deep-import ban into `logicalComponents/<Name>/` | consumers coupling to a container's internals | frontend `eslint.config.cjs` | react-app, bff-app |
| frontend depcruise rules | molecules importing api/containers, anything but `routes.tsx` importing pages, api importing components | frontend `.dependency-cruiser.cjs` | react-app, bff-app |
| `react-hooks/rules-of-hooks`, `exhaustive-deps` | conditional hooks, stale closures; also what makes the React Compiler bail out | frontend `eslint.config.cjs` | react-app, bff-app |
| `no-restricted-imports` react `useMemo`/`useCallback`/`memo` | hand memoization while the React Compiler is on | frontend `eslint.config.cjs` | react-app, bff-app |
| Rstest reuses `rsbuild.config.ts` (`withRsbuildConfig`) | tests compiled differently from the app (plugins, CSS Modules, aliases) | `rstest.config.ts` | react-app, bff-app |
| `/arch-drift-check` skill | what the linters cannot see: use-cases wrapping one service, policy above a gateway, inline prepared statements, containers rendering markup | `.claude/skills/arch-drift-check/` | all |

## Review-only (no mechanical guard yet)

Listed so nobody assumes they are enforced: classes-with-state vs functions (`common.md` §Design), banned fonts and gradients, new frontend dependencies without a task brief, cohesion (second variant of an existing visual choice), "a use-case that composes one service". `/arch-drift-check` covers the ones it can reason about.

## Options-do-not-merge trap

ESLint flat config replaces a rule's options when a later block sets the same rule, even with a narrower `files:`. A block that sets `no-restricted-imports` with only `patterns` silently drops every `paths` ban for the files it matches. The templates keep the bans in constants (`IMPORT_BANS`, `NETWORK_BANS`, `INLINE_STYLE_BANS`) and spread them into every block that touches the rule. When adding a block, spread the constants again.

## Smoke test

After scaffolding, prove each guard class fires once, then delete the violation. Minimum set per kind:

- all: `export * from './x.js'` in an `index.ts` → ESLint error and the hook blocks the write; a two-file import cycle → `no-circular`.
- package: `process.env.X` → `no-restricted-properties`.
- nest-service, bff-app: a controller importing a repository → `boundaries/dependencies` and `api-must-not-skip-to-data-access`; a constructor param without `@Inject()` → `local/require-inject-decorator`; `` prepare(`... ${id}`) `` → `local/no-interpolated-sql`; `process.env` in a service → `local/no-process-env-outside-config`.
- react-app, bff-app: `useQuery` in a molecule → `no-restricted-imports`; `useMemo` anywhere → `no-restricted-imports`; `fetch()` in a component → `no-restricted-syntax`; `style={{ padding: 4 }}` → `no-restricted-syntax`; `.container {}` in a module → `lint:css`; a molecule importing a page → `molecules-are-presentational`.

## Knowledge (proposed convention)

Domain knowledge attaches to code, not to a job title. The role is an agent; the knowledge is a path-scoped rule; the procedure is a skill; the why is an ADR.

- `.claude/rules/<domain>.md` with `paths: ["src/backend/<domain>/**"]`: what the subsystem is for, its invariants (the D2 concerns its gateway owns), its traps, which ADRs apply. Loads only when that tree is edited.
- `.claude/skills/<domain>-<verb>/SKILL.md` for procedures that run commands (`pii-debug`, `migration-doctor`).
- `docs/decisions/ADR-NNNN-<slug>.md` for the decision; the rule links to it.
- A new agent is warranted only when the work needs a different tool set or a different model. Different knowledge is a rule.
