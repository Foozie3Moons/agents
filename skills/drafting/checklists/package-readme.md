# Checklist: package README

The source is the code, the package manifest, and whatever the user said about the package. Every claim in the README has to come from one of those.

## Shape

- Title: the package name. One sentence under it on what the package does. No tagline.
- Install command next. Copy it from the manifest (package name, registry, peer deps). Do not guess.
- Then the shortest working example. It has to match the actual exported API. Read the exports before writing it.
- Then the API surface that matters: exported functions, options, config. Only what exists in the code.
- Then anything the user said belongs: limitations, status ("rough", "v0", "internal"), what it does not do.
- License line last if the repo has one. Omit it if there is none.

## Attribution checks

- Does not list features the code does not have, including ones on a roadmap the user did not state.
- Does not claim performance, compatibility, test coverage, or stability the user did not state.
- Does not describe design decisions or motivation the user did not give.
- Does not compare to other packages unless the user did.
- Does not invent a contributing section, a code of conduct, a roadmap, or a FAQ.
- Keeps the user's status words as written. "Still rough" stays "still rough".

## Formatting

- Headers only for sections that exist: Install, Usage, API, Limitations, License. Skip any that would be empty.
- Code blocks for every command and example, with the language set.
- No badges unless the user asked. No emoji. No table of contents.
- Short. A README is read once to decide whether to use the package and once to get it running.

## Before returning

- Install command and example checked against the manifest and exports.
- Every feature and claim traces to the code or the user's words.
- No banned words or tics.
- Placeholders for anything missing: `[TODO: license]`.
