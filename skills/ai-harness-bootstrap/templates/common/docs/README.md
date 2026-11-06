# docs

```
decisions/        ADR-NNNN-<slug>.md — decisions that outlive a feature (Status / Context / Decisions / Consequences)
work/<feature>/   spec.md and tasks.md for in-flight work; deleted when the feature merges
design-system.md  tokens, palette, type (frontend repos only)
layering-rulebook.md  normative layering rules, when the pocket reference in .claude/rules/ is not enough
```

Domain knowledge does not live here. It lives in `.claude/rules/<domain>.md` with a `paths:` frontmatter so it loads only when that tree is edited; procedures live in `.claude/skills/<domain>-<verb>/`. An ADR holds the why and the rule links to it.
