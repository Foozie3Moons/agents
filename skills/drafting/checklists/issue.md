# Checklist: issue or decision write-up

Covers GitHub and GitLab issues, tickets, ADR drafts and spec notes written under the user's name.

The source is what the user said, the thread or session it came from, and the code or logs they pointed at.

## Shape

- Title: the problem or the outcome, under 70 characters. Not a bare number or an internal label.
- First: the problem, in one or two sentences, in terms of what goes wrong for whom.
- Then: the decision that solves it. A write-up is not a list of decisions with the problem tacked on at the end.
- Then, only if there are any: what is still open, each with the proposed answer.
- Refer to other issues and pull requests by what they are, with the link, not by number alone.

## Attribution checks

- Only what the user explicitly agreed to is written as decided. A suggestion from an agent or anyone else stays labeled as proposed, with who proposed it.
- A brief "sounds good" confirms the shape of a proposal, not every detail in it. Details they did not address are proposed.
- Every deletion or change to an earlier decision carries the reason, not just the outcome.
- Keep their hedges. "Probably yes" is not "yes".

## Formatting

- Short ones are plain paragraphs. Headers only when it runs past a screen.
- Backtick identifiers, paths, env vars, flags.
- No emoji.

## Before returning

- The first thing a reader sees is the problem.
- Decided and proposed are visibly separate.
- No banned words or patterns.
- Placeholders for anything missing: `[TODO: link to the pull request]`.
