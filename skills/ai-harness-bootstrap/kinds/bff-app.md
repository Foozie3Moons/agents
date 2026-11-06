# bff-app

`nest-service` plus a BFF tree plus `react-app` under `src/frontend/`, as one pnpm workspace. The frontend talks to the BFF over HTTP only; the BFF consumes backend use-cases and application services; the backend does not know the BFF exists.

## Layout

```
src/backend/                 see nest-service.md
src/backend-for-frontend/
  bff.module.ts              BFF composition root; app.module.ts imports this and nothing else from the tree
  <feature>/                 same five layers; may import backend use-case/, application/, domain/ (types)
src/frontend/                see react-app.md; its own package.json, eslint, depcruise, vitest
src/shared/                  tiny constants both sides import (API_PREFIX, paths); nothing else
migrations/
```

Root `tsconfig.json` and root ESLint exclude `src/frontend`; the frontend is linted, type-checked and tested by its own configs, invoked from the root scripts. Root depcruise cruises everything so the cross-tree rules see both sides.

## Scripts

Root: `dev` (both, via concurrently), `dev:backend`, `dev:frontend`, `build`, `build:backend`, `build:frontend`, `typecheck`, `start`, `test`, `lint`, `depcruise`, `check`. Each root script fans out to `pnpm --dir src/frontend <script>`.

## Guards

The union of nest-service and react-app, plus the cross-tree rules (`backend-must-not-import-bff`, `bff-must-not-reach-backend-api-or-data-access`, `frontend-must-not-import-server-code`, `server-must-not-import-frontend`) and the bff-* boundaries elements.

## Rules copied

`common.md`, `backend.md` (paths `src/backend/**/*.ts`, `src/backend-for-frontend/**/*.ts`), `frontend.md` (paths `src/frontend/**`).

## First feature checklist

- Backend module first (migration → domain → repository → service → use-case if composite), then the BFF feature that shapes it for the UI, then the hook, container, molecule.
- A BFF feature that only forwards one application service still goes through its own `application/`; the layer-skip rules apply inside the BFF too.
- `src/shared/` stays tiny. If a type wants to cross, the frontend defines its own from the HTTP contract.
- Serving the built frontend from Nest (static assets) is a deploy decision, not a bootstrap default; the template proxies in dev only.
