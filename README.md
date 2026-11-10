# agents

Personal skills, plugins and agent-specific config.

## Layout

```
plugins/
  bff/                      Claude Code plugin: NestJS BFF + React
    agents/                 backend-engineer, frontend-engineer
    rules/                  common, backend, frontend (copied into repos by the bootstrap skill)
  engineering/              Claude Code plugin: architect, cleanup-engineer
skills/
  drafting/                 anything sent under my name
    SKILL.md, attribution.md, voice-profile.md, banned-words.md, tics.md, checklists/
  ai-harness-bootstrap/     new repo with every guard in place from the first commit
    SKILL.md                the flow
    anti-drift.md           every guard, what it catches, where it lives, how to prove it fires
    kinds/                  package, nest-service, react-app, bff-app
    scripts/scaffold.sh     layer assembly
    templates/              common, nest-common, package, nest-service, react-app, bff-app
  swiftui-pro/              SwiftUI review checklist, copied from Paul Hudson (see UPSTREAM.md)
  write-swift/              modern Swift language guide, copied from Emil Kowalski (see UPSTREAM.md)
```

## Install

Skills: symlink into whichever harness needs them.

```
ln -s "$(pwd)/skills/drafting" ~/.claude/skills/drafting
ln -s "$(pwd)/skills/ai-harness-bootstrap" ~/.claude/skills/ai-harness-bootstrap
ln -s "$(pwd)/skills/swiftui-pro" ~/.claude/skills/swiftui-pro
ln -s "$(pwd)/skills/write-swift" ~/.claude/skills/write-swift
```

Plugins: add this repo as a local marketplace in Claude Code and install `bff` and `engineering`, or symlink the agent files into `~/.claude/agents/`.

## Bootstrap a repo

```
bash skills/ai-harness-bootstrap/scripts/scaffold.sh bff-app ~/code/new-app
cd ~/code/new-app && pnpm install && pnpm check
```

Then follow `skills/ai-harness-bootstrap/SKILL.md` for naming, `CLAUDE.md`, and the smoke test that proves each guard fires.
