# <repo name>

<One sentence: what this is.>

## Stack

<Fill from package.json: runtime, framework, storage, test runner, package manager.>

## Layout

```
<tree, one line per top-level directory, from kinds/<kind>.md>
```

## Commands

- `pnpm build` — typecheck and build
- `pnpm test` — Vitest
- `pnpm lint` — ESLint (custom rules in `eslint-rules/`<, layering via eslint-plugin-boundaries>)
- `pnpm depcruise` — dependency-cruiser (cycles, orphans<, layer and tree edges>); `pnpm depcruise:graph` writes `docs/dependency-graph.svg`
- `pnpm check` — all of the above, what CI runs

## Rules

`.claude/rules/common.md` applies everywhere. <`backend.md` loads for `src/backend/**` and `src/backend-for-frontend/**`; `frontend.md` for `src/frontend/**`.> A lint or depcruise failure is a design error; do not add `eslint-disable` or a depcruise exception without an ADR.

## Agents and skills

Agents come from the `bff` and `engineering` plugins: `architect`, `backend-engineer`, `frontend-engineer`, `cleanup-engineer`. Task briefs carry scope; agents do not own directories. Skills in `.claude/skills/`: `/arch-drift-check`.

In-flight work lives in `docs/work/<feature>/{spec,tasks}.md` and is deleted when it merges. Decisions that outlive a feature go in `docs/decisions/ADR-NNNN-*.md`.
