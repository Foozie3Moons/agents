# agents

Personal skills and agent-specific config.

## Layout

```
skills/
  drafting/
    SKILL.md              entry point for anything written under my name
    attribution.md        never attribute to me what I did not say
    voice-profile.md      how my writing sounds
    banned-words.md       vocabulary to strip from drafts
    tics.md               patterns that read as AI-generated
    checklists/
      mr-description.md
      slack-message.md
```

## Install

Symlink a skill into whichever harness needs it:

```
ln -s "$(pwd)/skills/drafting" ~/.claude/skills/drafting
```
