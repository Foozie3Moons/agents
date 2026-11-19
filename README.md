# agents

My skills, Claude Code plugins and agent config, kept in one repo so every project and harness reads the same rules. Nothing here is specific to one project: skills say "the user", and anything copied out of a private repo has its names and paths removed first.

## What's here

| Path | What it is | When it's used |
|---|---|---|
| `plugins/bff/` | `backend-engineer` and `frontend-engineer` agents, plus the three rules files they follow | Building in a NestJS backend-for-frontend app with a React frontend |
| `plugins/engineering/` | `architect`, `spike` and `cleanup-engineer` agents | Any repo: writing a spec, scoping an experiment, deleting dead code |
| `skills/ai-harness-bootstrap/` | Scaffolds a new repo with every lint, hook and CI guard on from the first commit | Starting a package, Nest service, React app or BFF app |
| `skills/decompose/` | Turns an approved spec into a task list grouped by pull request | After the architect's spec is approved |
| `skills/dispatch/` | Runs a task from that list: spawns the engineer agent, checks acceptance itself, commits | Working through a task list from the main session |
| `skills/drafting/` | Rules for anything sent or published under my name | Slack, pull request descriptions, issues, READMEs, posts |
| `skills/swiftui-pro/` | SwiftUI review checklist, copied from Paul Hudson at a pinned commit | Reviewing SwiftUI code |
| `skills/write-swift/` | Swift language guide, copied from Emil Kowalski at a pinned commit | Writing Swift |

## How the pieces fit

The flow for a feature is architect, decompose, dispatch:

1. `architect` runs discovery one question at a time and writes `docs/work/<feature>/spec.md`. The spec opens with a review block: the problem, what I decided, what still needs my yes, and risks. If a design rests on something nobody has verified, `spike` writes the brief for a throwaway experiment first.
2. `/decompose <feature>` turns the spec into `docs/work/<feature>/tasks.md`. Each task names its agent, the files it may touch, its tests and its acceptance criteria.
3. `/dispatch` picks the next ready task, hands it to `backend-engineer`, `frontend-engineer` or `cleanup-engineer`, then runs the acceptance checks itself before committing. It doesn't trust the agent's report, and it never merges.
4. The feature's last pull request deletes `docs/work/<feature>/`. Decisions that outlive the feature move to an ADR before that.

There is no orchestrator agent. The main session dispatches.

The rules the engineer agents follow are only half of it. `skills/ai-harness-bootstrap/anti-drift.md` lists every rule that has a mechanical guard (ESLint, dependency-cruiser, a hook, a test, CI) and, separately, the ones that are still review-only. A rule that only exists in markdown is advice.

## plugins/bff

```
agents/
  backend-engineer.md   server trees, migrations, gateways, BFF controllers
  frontend-engineer.md  pages, layouts, containers, molecules, styles, stories
rules/
  common.md             design (classes, DDD), code, security, testing, git
  backend.md            five-layer modules, cross-module and cross-tree tables, gateways, repositories, row schemas, schema changes
  frontend.md           container/presentational, CSS Modules, React Query, the React Compiler, banned defaults
```

The rules ship without `paths:` frontmatter. The bootstrap skill copies them into a repo's `.claude/rules/` and adds the paths for that repo's layout. See `plugins/bff/README.md`.

## plugins/engineering

```
agents/
  architect.md          discovery, then docs/work/<feature>/spec.md
  spike.md              the brief for an experiment that answers what a design depends on
  cleanup-engineer.md   delete-only: dead code, orphans, unused dependencies
```

None of them assume a stack. They read `CLAUDE.md` and `.claude/rules/` from the repo they run in. See `plugins/engineering/README.md`.

## skills/ai-harness-bootstrap

```
SKILL.md                the eight steps, from picking a kind to the first commit
anti-drift.md           every guard, what it catches, where it lives, how to prove it fires
kinds/                  package, nest-service, react-app, bff-app: layout, scripts, guards, first-feature checklist
scripts/scaffold.sh     layers the templates into an empty directory
templates/
  common/               CLAUDE.md, CI, Prettier config, hooks (barrel-file guard, format on edit), ADR template
  nest-common/          the six custom ESLint rules for Nest code
  package/              TypeScript library
  nest-service/         Nest app: config, database, logging, migrations, schema contract test
  react-app/            Rsbuild, React 19, React Query, CSS Modules, Storybook, Rstest
  bff-app/              nest-service plus react-app under src/frontend, a BFF tree and shared constants
```

All four kinds pass `pnpm check` straight after scaffolding.

## skills/drafting

```
SKILL.md                the steps and the hard rules (claims only from the source, smallest edit, no filled gaps)
attribution.md          whose words are whose
voice-profile.md        how I write
banned-words.md         words that never appear
tics.md                 AI writing patterns to check for
checklists/             change-request, issue, package-readme, slack-message, linkedin-post, discord-post
```

## skills/swiftui-pro and skills/write-swift

Third-party skills are copied in at a pinned commit, not installed from upstream. Pointing at someone else's skill repo means their next edit changes what my agents read, which is a prompt injection path for little gain. Each folder keeps the upstream `LICENSE` and an `UPSTREAM.md` with the source commit and any local changes.

## Install

Skills: symlink into whichever harness needs them.

```sh
for s in ai-harness-bootstrap decompose dispatch drafting swiftui-pro write-swift; do
  ln -s "$(pwd)/skills/$s" ~/.claude/skills/$s
done
```

Plugins: add this repo as a local marketplace in Claude Code and install `bff` and `engineering`, or symlink the agent files into `~/.claude/agents/`.

```sh
ln -s "$(pwd)"/plugins/*/agents/*.md ~/.claude/agents/
```

## Bootstrap a repo

```sh
bash skills/ai-harness-bootstrap/scripts/scaffold.sh bff-app ~/code/new-app
cd ~/code/new-app && pnpm install && pnpm check
```

Then follow `skills/ai-harness-bootstrap/SKILL.md` for naming, `CLAUDE.md`, and the smoke test that proves each guard fires.

## Limitations

- The rules and templates assume my stack: TypeScript, NestJS, better-sqlite3, React 19, Rsbuild, Rstest, pnpm. There is no Rails or Postgres kind.
- The Swift skills are other people's work and don't follow the class-first rule the TypeScript rules use.
- `plugins/bff/rules/` is the source for the rules files. A repo's `.claude/rules/` is a copy and has to be re-copied after a change here.
