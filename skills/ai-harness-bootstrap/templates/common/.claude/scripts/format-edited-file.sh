#!/usr/bin/env bash
# PostToolUse hook for Edit/Write/MultiEdit. Runs Prettier on the one file the
# tool just wrote, so agent edits land formatted without a separate step.
#
# Hook input: JSON on stdin with tool_input.file_path
# Always exits 0 with no output: a formatting failure (syntax error mid-edit,
# Prettier not installed) must not interrupt the agent. CI's format:check is
# the gate, not this hook.

set -u

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | python3 -I -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null)

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PRETTIER="$ROOT/node_modules/.bin/prettier"

if [ ! -x "$PRETTIER" ]; then
  exit 0
fi

# --ignore-unknown skips file types Prettier has no parser for; .prettierignore
# (build output, docs, migrations, Markdown) is honored because we run from the root.
cd "$ROOT" && "$PRETTIER" --write --ignore-unknown --log-level silent "$FILE_PATH" >/dev/null 2>&1

exit 0
