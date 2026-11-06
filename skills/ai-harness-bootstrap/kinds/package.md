# package

A TypeScript library consumed by other repos (or as a git submodule before it is published). NodeNext ESM, `exports` map, `dist/` only in the tarball.

## Layout

```
src/
  index.ts        public API: named re-exports only; nothing internal imports it
  <feature>.ts    one concern per file; classes for anything with state or dependencies
  *.test.ts       co-located
docs/             README.md, decisions/
```

Grouping inside `src/` is by feature, not by type. No `utils/`. A package that grows a port/adapter shape (a store interface and two implementations) uses `<interface>-<implementation>.ts` names, not subpackages, until a second consumer forces a split.

## Scripts

`build` (tsc to `dist/`), `typecheck`, `test`, `lint`, `depcruise`, `check` (what CI runs).

## Guards

Common set plus `no-restricted-properties process.env` (a library takes config as arguments) and `index-is-not-imported-internally`. No Nest rules, no boundaries: a library has no layers until it has a reason to; when it does, copy the `boundaries/elements` block from `nest-service` and define the elements for its own directories.

## Rules copied

`.claude/rules/common.md` only.

## First feature checklist

- The entry exports a class or function per public concern, each from its own file.
- `package.json` `name` and `exports` are real. `files: ["dist"]` stays.
- Peer dependencies for anything the consumer already has (`@nestjs/common` in a Nest module package) go in `peerDependencies`, not `dependencies`.
- README follows the user's package-README rules (Install / Usage / API / Limitations / License, every claim from the code).
