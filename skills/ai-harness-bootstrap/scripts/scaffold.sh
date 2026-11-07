#!/usr/bin/env bash
# Assemble a new repo from the template layers.
#   scaffold.sh <kind> <target-dir>     kind: package | nest-service | react-app | bff-app
# Copies files only; naming, CLAUDE.md, rules paths and git init are the skill's job.
set -euo pipefail

KIND="${1:?kind}"
TARGET="${2:?target dir}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$HERE/templates"

layer() { cp -R "$T/$1/." "$2/"; }

mkdir -p "$TARGET"
if [ -n "$(ls -A "$TARGET")" ]; then
  echo "refusing: $TARGET is not empty" >&2
  exit 1
fi

layer common "$TARGET"
case "$KIND" in
  package)
    layer package "$TARGET"
    ;;
  nest-service)
    layer nest-common "$TARGET"
    layer nest-service "$TARGET"
    ;;
  react-app)
    layer react-app "$TARGET"
    ;;
  bff-app)
    layer nest-common "$TARGET"
    layer nest-service "$TARGET"
    mkdir -p "$TARGET/src/frontend"
    layer react-app "$TARGET/src/frontend"
    # docs belong at the repo root, not under src/frontend
    mv "$TARGET/src/frontend/docs/design-system.md" "$TARGET/docs/design-system.md"
    rmdir "$TARGET/src/frontend/docs"
    rm -f "$TARGET/src/frontend/pnpm-workspace.yaml"
    # pnpm reads onlyBuiltDependencies from the workspace root only
    node -e '
      const fs = require("fs"); const p = process.argv[1];
      const j = JSON.parse(fs.readFileSync(p, "utf8")); delete j.pnpm;
      fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
    ' "$TARGET/src/frontend/package.json"
    layer bff-app "$TARGET"
    ;;
  *)
    echo "unknown kind: $KIND (package | nest-service | react-app | bff-app)" >&2
    exit 1
    ;;
esac

# Rules: copy from the bff plugin with paths: frontmatter for this layout.
RULES="$HERE/../../plugins/bff/rules"
mkdir -p "$TARGET/.claude/rules"
cp "$RULES/common.md" "$TARGET/.claude/rules/common.md"
case "$KIND" in
  nest-service)
    { printf -- '---\npaths:\n  - "src/backend/**/*.ts"\n  - "src/backend-for-frontend/**/*.ts"\n---\n'; cat "$RULES/backend.md"; } > "$TARGET/.claude/rules/backend.md"
    ;;
  react-app)
    { printf -- '---\npaths:\n  - "src/**"\n---\n'; cat "$RULES/frontend.md"; } > "$TARGET/.claude/rules/frontend.md"
    ;;
  bff-app)
    { printf -- '---\npaths:\n  - "src/backend/**/*.ts"\n  - "src/backend-for-frontend/**/*.ts"\n---\n'; cat "$RULES/backend.md"; } > "$TARGET/.claude/rules/backend.md"
    { printf -- '---\npaths:\n  - "src/frontend/**"\n---\n'; cat "$RULES/frontend.md"; } > "$TARGET/.claude/rules/frontend.md"
    ;;
esac

chmod +x "$TARGET/.claude/scripts/"*.sh
echo "scaffolded $KIND into $TARGET"
find "$TARGET" -type f | sed "s#^$TARGET/##" | sort
