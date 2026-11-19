# bff

Two engineer agents and the rules they follow, for a NestJS backend-for-frontend app with a React frontend.

## Agents

| Agent | Works in | Does |
|---|---|---|
| `backend-engineer` | `src/backend/`, `src/backend-for-frontend/`, migrations | Implements one backend task from a brief: migration, domain types, repository, service, use-case, controller, in that order, with tests against `:memory:` SQLite |
| `frontend-engineer` | the React tree | Implements one UI task from a brief: containers that fetch, molecules that render props, CSS Modules on design tokens, stories, React Testing Library tests |

Both run on Opus. Both take their scope from the task brief, not from a directory they own. Both stop and report when a task needs a layer skip, a new dependency the brief doesn't name, or a lint exception. Neither commits; the dispatcher does after checking acceptance.

## Rules

| File | Covers |
|---|---|
| `rules/common.md` | Design (anything with state or dependencies is a class, a helper that serves one class is a method of it, ports owned by the consumer), code limits, comments, formatting, security, testing, git |
| `rules/backend.md` | The five layers (`api/`, `use-case/`, `application/`, `data-access/`, `domain/`), which layer may import which, cross-module and cross-tree tables, what a gateway must own, repository shape, row schemas, schema changes, Nest lifecycle, testing |
| `rules/frontend.md` | Container/presentational split, CSS Modules and tokens, React Query hooks only in `api/use*.ts`, the React Compiler owning memoization, banned default fonts and gradients, no un-briefed dependencies |

`backend.md` and `frontend.md` extend `common.md` and win on conflict.

Most of these rules have a mechanical guard in a bootstrapped repo. `skills/ai-harness-bootstrap/anti-drift.md` has the full list, and says which rules are still review-only.

## How the rules reach a repo

The agents read the rules from `.claude/rules/` in the repo they run in. The `ai-harness-bootstrap` skill copies `rules/` there and adds `paths:` frontmatter for that repo's layout, so `backend.md` loads only for backend files. The plugin ships them without `paths:` so they also work as plain reference.

They are copied, not loaded from the plugin, because a rule has to carry the repo's own paths. Edit a rule here and re-copy it. A repo-local edit is a fork and should say so at the top of the file.

## Install

As a Claude Code plugin from a local marketplace pointing at this repo, or symlink:

```sh
ln -s "$(pwd)/plugins/bff/agents/backend-engineer.md" ~/.claude/agents/backend-engineer.md
ln -s "$(pwd)/plugins/bff/agents/frontend-engineer.md" ~/.claude/agents/frontend-engineer.md
```

`architect`, `spike` and `cleanup-engineer` are in `plugins/engineering`.
