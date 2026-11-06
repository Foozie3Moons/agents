---
name: ai-harness-bootstrap
description: Use when creating a new repo, package, service or app, or when asked to bootstrap, scaffold, or set up a project for agent-driven development. Sets up the layout, rules, agents, hooks, lint, dependency-cruiser and CI so every anti-drift measure is in place from the first commit. Not for adding a feature to an existing repo.
arguments: "<kind> <target-dir> [name]"
---

# AI harness bootstrap

A new repo gets every mechanical guard on day 1, before the first feature. Retrofitting a rule onto a codebase that already violates it costs a cleanup PR per rule; adding it to an empty repo costs nothing. The kinds, what each contains, and the full list of guards are in `kinds/` and `anti-drift.md`.

## Steps

1. Pick the kind. `package` (TS library), `nest-service` (Nest, no UI), `react-app` (Vite + React, no server), `bff-app` (Nest + BFF + React, pnpm workspace). If the user did not say, ask once; the four are described in `kinds/<kind>.md`. Read that file before scaffolding.
2. Scaffold: `bash scripts/scaffold.sh <kind> <target-dir>`. It refuses a non-empty directory. It layers `templates/common`, the kind's templates, and copies `.claude/rules/*.md` from `plugins/bff/rules/` with `paths:` frontmatter set for the layout.
3. Name it. Replace the placeholders: `name` in every `package.json` (`@scope/package-name`, `service-name`, `app-name`), `<title>` in `index.html`, and the first two lines of `CLAUDE.md`. Nothing else in the templates is a placeholder.
4. Fill `CLAUDE.md` from the kind doc's layout block and the real `package.json` scripts. Delete the angle-bracket hints. Keep it under 60 lines; it is read on every turn.
5. Install and verify: `pnpm install`, then `pnpm check`. All four kinds are green out of the box; if `check` fails, the scaffold or a version drifted, fix that, never skip the step.
6. Prove the guards fire. Add one deliberate violation per guard class the kind has (see `anti-drift.md` §Smoke test), confirm the exact rule reports it, then remove it. A guard that was never seen failing is assumed broken.
7. `git init`, first commit `chore: bootstrap <kind>` with no attribution trailers. Branch protection and CI required checks are the user's to set; say so in the report.
8. Report: the kind, the path, the commands, which guards were proven, and anything the user still has to decide (design tokens, the first ADR, vendor SDK fences).

## Rules

- Never remove a guard to make the first commit green. A template guard that fails on template code is a bug in this skill: fix the template.
- Never add `eslint-disable`, a depcruise `pathNot`, or a hook allowlist entry during bootstrap.
- `.claude/rules/*.md` are copies from `plugins/bff/rules/`. Edit them in the plugin and re-copy; a repo-local edit is a fork and must say so at the top of the file.
- Dependencies come from the templates' pinned ranges. Do not bump versions during bootstrap; that is its own PR with `pnpm check` as the gate.
- Domain knowledge does not become an agent. A new domain gets `.claude/rules/<domain>.md` with `paths:` scoped to its tree, a `.claude/skills/<domain>-<verb>/` for procedures, and an ADR for the why. A new agent is warranted only for a different tool set or model (proposed convention, see `anti-drift.md` §Knowledge).

## Templates

```
templates/
  common/        CLAUDE.md, .tool-versions, .github/workflows/ci.yml, .claude/{settings.json,scripts/guard-barrel-files.sh,skills/arch-drift-check}, docs/
  nest-common/   eslint-rules/*.cjs (the five custom rules; Nest kinds only)
  package/       library: NodeNext ESM, exports map, named-export entry
  nest-service/  Nest app: core/{config,database,logging}, migrations/, boundaries + depcruise layer rules
  react-app/     Vite + React 19 + React Query + CSS Modules + Storybook + RTL; frontend lint and depcruise
  bff-app/       nest-service + react-app under src/frontend + src/backend-for-frontend + src/shared
scripts/scaffold.sh   layer assembly
kinds/<kind>.md       layout, scripts, which guards apply, first-feature checklist
anti-drift.md         every guard, what it catches, where it lives, how to prove it fires
```
