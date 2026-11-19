---
name: decompose
description: Break an approved spec in docs/work/<feature>/spec.md into a task list at docs/work/<feature>/tasks.md that the engineer agents can execute one task at a time, grouped by PR. Use after the architect's spec is approved and before dispatching work.
arguments: "<feature>"
---

# Decompose

Turn `docs/work/$ARGUMENTS/spec.md` into `docs/work/$ARGUMENTS/tasks.md`. Use the `task-generator` skill's template and sizing rules if it is available, with the conventions below. The spec is the only input; do not re-derive decisions from issues or code. Read the repo's `CLAUDE.md` for its commands and layout first.

## Conventions

These override a generic template where they differ.

- **For review block first.** `tasks.md` opens with a short block: the problem in one sentence, the PRs in order, spec gaps that made a task ambiguous, and any assumption that needs the user's yes. The task detail follows.
- **Grouped by PR.** The spec sequences work into PRs. `tasks.md` has one `## PR N: <title>` section per spec PR, in spec order, and tasks are numbered `N.M`. A PR section opens with its branch name, the PR it is based on, and the one-line problem the PR solves, taken from the spec. Default to one pull request per feature; split only where the spec does.
- **Scope, not ownership.** Agents do not own directories. Each task has a `**Scope:**` list of the files and directories it may create, change or delete, and a `**Touches nothing else**` line. Two tasks in the same PR may name the same directory only if they are sequential; parallel tasks in one PR have disjoint scope. The ownership table at the end is per PR.
- **Agent per task.** Each task names its agent: `backend-engineer` for the server trees, migrations, lint rules and config; `frontend-engineer` for the React tree; `cleanup-engineer` for deletion-only tasks (removing modules, tables, dependencies, dead config). A task that both deletes and adds is split into a cleanup task followed by an engineer task.
- **Layering.** A backend task that creates a module or layer names the layer for every file (`api/`, `use-case/`, `application/`, `data-access/`, `domain/`) and states the cross-module imports it needs, which must be `application/` services or `domain/` types only. `.claude/rules/backend.md` is the rule; the task does not restate it.
- **Classes and functions.** Anything with state or dependencies is a class with constructor injection. A helper that serves one class is a method of it. Plain functions only for standalone calculations, each in its own file. Tasks say which new things are providers.
- **Schema.** A task that changes schema names the migration file number and the tables it creates, alters or drops, and adds the Zod row schema and its schema-contract entry in the same task. It cites the spec's schema review block; if the spec has none, that is a spec gap to report, not a task to write.
- **Tests.** Every behavior in a task's acceptance criteria has a test that would fail if it broke. Tasks list the test files they add or change. No tests for module shells, DTOs, decorator metadata.
- **Acceptance.** Every task ends with the repo's full gate passing (`pnpm check`, or the commands `CLAUDE.md` lists), plus task-specific criteria that are verifiable by running something or reading a file. Never "works correctly".
- **Operator surface.** A backend task that adds or changes behavior names where the user sees or configures it, or says "no surface" with the reason.
- **Commits.** One commit per task, `<type>: <description>`, under 72 characters, no attribution trailers. The agent does not commit; the dispatcher does after verifying acceptance.
- **Close-out.** The feature's last PR ends with a task that deletes `docs/work/<feature>/` (see `dispatch`).

## Output shape

```markdown
# <Feature> tasks

## For review
<problem, PRs in order, spec gaps, assumptions needing a yes>

Spec: docs/work/<feature>/spec.md. Branches chain in order; nothing merges without review.

## Dependency graph
<ASCII graph of PRs, then of tasks inside each PR where more than one>

## PR 1: <title>
Branch `<branch>` from `main`. Problem: <one line>.

### Task 1.1: <name> (backend-engineer)
**Scope:** ...
**Creates / Changes / Deletes:** ...
**Key implementation:** (only non-obvious code)
**Tests:** ...
**Acceptance:**
- [ ] ...
- [ ] `pnpm check` passes

## Ownership (PR 1)
| Task | Scope | Never touches |
```

## After writing

Report the task count per PR, which tasks can run in parallel, and any spec gap that made a task ambiguous. Do not fill the gap; name it.
