#!/usr/bin/env bash
# PreToolUse hook for Edit|Write|MultiEdit.
# Blocks `export * from` in any index.ts / index.tsx at write time, before
# ESLint would catch it. Barrel re-exports resolve at class-declaration time
# and turn a circular import into an undefined Nest provider at boot.
#
# Hook input: JSON on stdin. Allow: exit 0. Block: exit 2, reason on stderr.
set -u
INPUT=$(cat)
read -r FILE_PATH TEXT < <(printf '%s' "$INPUT" | python3 -I -c '
import json, sys
d = json.load(sys.stdin)
t = d.get("tool_input", {})
path = t.get("file_path", "")
text = t.get("content") or t.get("new_string") or ""
if "edits" in t:
    text = "\n".join(e.get("new_string", "") for e in t["edits"])
print(path, repr(text))
' 2>/dev/null) || exit 0

case "$(basename "$FILE_PATH")" in
  index.ts|index.tsx) ;;
  *) exit 0 ;;
esac

if printf '%s' "$TEXT" | grep -qE 'export \* (as [A-Za-z_$][A-Za-z0-9_$]* )?from'; then
  cat >&2 <<MSG
BLOCKED: \`export * from\` in $FILE_PATH

Barrel re-exports are banned (.claude/rules/common.md §Code). Import from the
source file. If this index file is a package entry point, list the public API
as named exports: \`export { Foo } from './foo.js'\`.
MSG
  exit 2
fi
exit 0
