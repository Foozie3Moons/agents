# Checklist: change request description

Covers GitLab merge requests, GitHub pull requests, and anything else that proposes a change for review.

The source is the diff, the ticket, and whatever the user said about the change. Everything in the description has to come from one of those.

## Shape

- Title: imperative, under 70 characters, what the change does. No ticket number in the title unless the project convention requires it.
- First line of the body: one sentence on the problem this change fixes.
- Then what changed, in the order a reviewer should read it. Group by behavior rather than by file.
- Then how it was verified. Only list verification the source confirms. If the user did not say they ran the tests, do not say they ran the tests.
- Then anything a reviewer needs to know: follow-ups, known gaps, rollout or migration steps, flags to flip.

## Attribution checks

- Do not describe intent the diff does not show and the user did not state.
- Do not claim performance, safety, or compatibility properties unless the source states them.
- If the change was pair-written or came from someone else's suggestion, say so.
- Do not comment on the quality of the old code.

## Formatting

- Headers only if the description runs past a screen. Short ones are plain paragraphs.
- Backtick identifiers, paths, env vars, flags.
- No emoji, no checkboxes unless the project template uses them.
- No "Summary" header above a single paragraph.

## Before returning

- Every sentence traces to the diff, the ticket, or their words.
- Verification section contains nothing unverified.
- No banned words or patterns.
- Placeholders for anything missing: `[TODO: ticket link]`.
