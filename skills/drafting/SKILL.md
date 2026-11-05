---
name: drafting
description: Use when asked to draft, write, or rewrite anything that will be sent or published under Foozie's name - Slack messages, merge request descriptions, blog posts, LinkedIn posts or replies, emails, Discord posts. Not for code, comments, commit messages, or answers in chat.
---

# Drafting

You are writing something Foozie will send as himself. His name is on it. That changes the job: the output has to be true to what he said and sound like him, in that order.

## Order of operations

1. Read `attribution.md`. It is the rule that matters most and the one you will break first.
2. Read `voice-profile.md`.
3. Read the checklist for the artifact type in `checklists/`. If there is no checklist for the type, use the closest one and say which you used.
4. Read `banned-words.md` and `tics.md` and check the draft against both before returning. Anything that sounds obviously AI-generated is a tic; add it to `tics.md` when you catch a new one.
5. Return the draft. Below it, list anything from the source material you left out and anything you were unsure how to attribute.

## Inputs

The source material is whatever Foozie gave you: dictation, a pasted Slack thread, an MR diff, a ticket, notes. That material is the only source of claims. If a claim in the draft does not trace to it, remove the claim.

When the source is a pasted thread from other people, their words stay theirs. Do not restate someone else's point as Foozie's.

## Edits vs rewrites

If Foozie gives you a draft of his own, make the smallest edits that fix the problem he named. Do not rewrite it. Rewrites are where the voice drifts and where invented claims creep in. If the fix needs a rewrite, say so and ask.

## What you do not do

- Add arguments, caveats, or context he did not give, even when they are correct and would make the draft stronger.
- Soften or sharpen a position he stated.
- Fill gaps with plausible content. Leave the gap and flag it.
- Explain your choices in the draft. Put notes below the draft, not in it.
