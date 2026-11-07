---
name: arch-drift-check
description: Walk the codebase against .claude/rules/*.md and report what the mechanical checks cannot see — layer skips through passthroughs, use-cases that wrap one service, policy held above a gateway, inline prepared statements. Use after a feature lands or when something feels off.
arguments: "[--module <name>] [--strict]"
---

# Architecture Drift Check

Audit the repo for rule violations the linters do not catch. Arguments: `$ARGUMENTS`

Run the mechanical checks first and paste their output at the top of the report: `pnpm lint`, `pnpm depcruise`. Everything below is what those cannot see.

## Source of truth

`.claude/rules/common.md`, `.claude/rules/backend.md`, `.claude/rules/frontend.md`, and `docs/layering-rulebook.md` plus `docs/decisions/ADR-*.md` when present. If they conflict, the rulebook wins, then the ADR, then the rule file. If a thing isn't covered, do not fabricate a rule.

## What to check

Backend (`src/backend/<module>/`, `src/backend-for-frontend/<feature>/`):

1. **Use-case that composes one service.** Delete candidate (backend.md §D1).
2. **Policy above the gateway.** A decorator or use-case doing redaction, usage recording, rate limiting or retries that belong in the gateway (§D2).
3. **Generic CRUD names** on repositories that the ESLint rule's heuristic missed (`get`, `list`, `save` taking a whole entity).
4. **Prepared statements built inside methods** instead of the constructor.
5. **Logic in controllers or tool factories** that belongs on a domain object or application service.
6. **Classes that should be functions, functions that should be classes** (common.md §Design).
7. **Config read outside `core/config`** through indirection the rule cannot see (a wrapper around `process.env`).

Frontend:

8. **Containers that render markup** or molecules that fetch.
9. **Server state copied into `useState` or Context.**
10. **Derived state stored in the query cache.**
11. **A second variant of an existing visual choice** (a new spacing value, a new button shape).

## Behavior

- No arguments: whole repo, violations grouped by module.
- `--module <name>`: one module.
- `--strict`: non-zero exit if any violation is found.

## Output

```
## arch-drift-check report

pnpm lint: clean
pnpm depcruise: 0 errors, 1 warning (orphan: src/backend/foo/domain/unused.ts)

Module: src/backend/agents
  ✗ use-case/run-agent.use-case.ts:12 — composes one application service; call it from api/ directly (backend.md §D1)
  ✗ data-access/agent.repository.ts:142 — db.prepare() inside a method (backend.md §Prepared Statements)

Module: src/backend/conversations
  ✓ clean
```

Lead with a one-line summary: modules audited, violations found.

## Rules

- Never fabricate a rule not in the sources above.
- Never flag a smell as a violation. Only what the rules explicitly forbid; cite the section.
- Do not fix violations as a side effect. Report only; fixes are dispatched to the relevant engineer.
