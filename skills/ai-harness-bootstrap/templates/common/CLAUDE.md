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
- `pnpm test` — Rstest
- `pnpm format` / `pnpm format:check` — Prettier (single quotes, 120 columns); a hook formats each file an agent edits
- `pnpm lint` — ESLint (custom rules in `eslint-rules/`<, layering via eslint-plugin-boundaries>)
- `pnpm depcruise` — dependency-cruiser (cycles, orphans<, layer and tree edges>); `pnpm depcruise:graph` writes `docs/dependency-graph.svg`
- `pnpm check` — all of the above, what CI runs

## Rules

`.claude/rules/common.md` applies everywhere. <`backend.md` loads for `src/backend/**` and `src/backend-for-frontend/**`; `frontend.md` for `src/frontend/**`.> A lint or depcruise failure is a design error; do not add `eslint-disable` or a depcruise exception without an ADR.

## Agents and skills

Agents come from the `bff` and `engineering` plugins: `architect` (discovery → spec), `spike` (unverified assumption → spike brief), `backend-engineer`, `frontend-engineer`, `cleanup-engineer`. Task briefs carry scope; agents do not own directories. Skills: `/arch-drift-check` in `.claude/skills/`; `/decompose` (spec → task list) and `/dispatch` (run a task, verify, commit) from the user's skills.

In-flight work lives in `docs/work/<feature>/{spec,tasks}.md`. The feature's last pull request deletes the folder as its last commit, so nothing shipped stays there and no comment cites it. Decisions that outlive a feature go in `docs/decisions/ADR-NNNN-*.md`.
