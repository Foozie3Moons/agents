# bff

Agents and rules for a NestJS backend-for-frontend with a React frontend.

```
agents/
  backend-engineer.md   src/backend/, src/backend-for-frontend/ (opus)
  frontend-engineer.md  the React tree (opus)
rules/
  common.md             DDD/OOP, code, security, testing, git; applies everywhere
  backend.md            five-layer modules, cross-module and cross-tree tables, gateway-owns-wire, repository shape
  frontend.md           container/presentational, CSS Modules, React Query hooks only in api/use*.ts
```

The agents read the rules from `.claude/rules/` in the target repo. The `ai-harness-bootstrap` skill copies `rules/` there with the `paths:` frontmatter set for the repo's layout; the plugin ships them without `paths:` so they are usable as plain reference too. Rules are copied rather than loaded from the plugin because a rule has to carry the repo's own paths.

Install as a Claude Code plugin from a local marketplace pointing at this repo, or symlink:

```
ln -s "$(pwd)/plugins/bff/agents/backend-engineer.md" ~/.claude/agents/backend-engineer.md
ln -s "$(pwd)/plugins/bff/agents/frontend-engineer.md" ~/.claude/agents/frontend-engineer.md
```

`architect` and `cleanup-engineer` are in `plugins/engineering`.
