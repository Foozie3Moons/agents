# engineering

Three agents that don't assume a stack. Each reads `CLAUDE.md` and `.claude/rules/*.md` from the repo it runs in.

| Agent | Model | Tools | Output |
|---|---|---|---|
| `architect` | Fable | Read, Write, Glob, Grep | `docs/work/<feature>/spec.md` |
| `spike` | Fable | Read, Write, Glob, Grep | `docs/work/<feature>/spikes/<spike>/brief.md` |
| `cleanup-engineer` | Opus | Read, Edit, Write, Bash, Glob, Grep | Deletions only |

## architect

Turns a fuzzy problem into a spec two engineers would build the same way. It asks one question per turn, starting with the pain point, and never asks what the repo already answers. It stops asking when the current state, the target state and every decision that would change the spec's shape are known.

The spec opens with a review block: the problem in one sentence, what the user decided, what needs their yes with the proposed answer, deviations from what they said, and risks. Only what the user explicitly agreed to counts as decided. A spec that touches a table carries a schema review block. It writes no code and no tasks.

## spike

Writes the brief for a throwaway experiment, for when a design rests on how an external API, SDK, platform or device behaves and nobody has checked. It asks which decision is blocked first; a spike with no decision waiting on it isn't a spike, and it says so and stops.

The brief lists every unchecked claim with where it came from, and at most eight questions, each with what to try and what each answer means for the design. It doesn't write or run the spike code.

## cleanup-engineer

Makes the codebase smaller without changing what it does, one subsystem per dispatch. It proves code is dead before deleting it (every reference searched, then a typecheck after removal), removes the lint exceptions that only existed for the deleted code, and reverts and reports if a check fails. It never adds behavior.

## What isn't here

Decompose and dispatch are skills in `skills/`, run from the main session. There is no orchestrator agent. The stack-specific engineers are in `plugins/bff`.

## Install

As a Claude Code plugin from a local marketplace pointing at this repo, or symlink:

```sh
ln -s "$(pwd)"/plugins/engineering/agents/*.md ~/.claude/agents/
```
