# Checklist: package README

Covers the README of a library, CLI, plugin or service repo.

The source is the code, the manifest (`package.json`, `Package.swift`, `Gemfile`, and so on) and whatever the user said about the package. Every claim comes from one of those.

## Shape

- Title: the package name, then one sentence on what it is.
- `## Install`: copied from the manifest (the real name, the real package manager, the real version constraints). Do not write an install line for a registry the package is not published to.
- `## Usage`: the shortest example that works against the real exports. Check each identifier in it against the code.
- `## API`: what exists. No planned or implied surface.
- `## Limitations`: the user's own words on limits and status, as they wrote them.
- `## License`: one line, only if the repo has a license file.

Those five are the only headers. Leave out any that has nothing true to put under it.

## Attribution checks

- No performance, stability, test coverage or comparison claim the user did not make.
- No "production-ready", "battle-tested", "fast", "lightweight" or similar unless they said it.
- Status stays at the level they stated it. "I use it in one project" does not become "used in production".

## Formatting

- Code blocks carry a language tag.
- No badges, emoji, table of contents, roadmap, contributing section, code of conduct or FAQ.

## Before returning

- Every identifier in the usage example exists in the code.
- The install line matches the manifest.
- No banned words or patterns.
- Placeholders for anything missing: `[TODO: license]`.
