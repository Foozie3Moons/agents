# react-app

A Vite + React 19 app with no server in the repo: a microfrontend, a dashboard against an existing API, a static tool. React Query for server state, CSS Modules with tokens, Storybook, React Testing Library, msw for API mocking in tests.

## Layout

```
src/
  main.tsx                   mount; one of two files that may import router constructors
  routes.tsx                 the other; the only importer of pages/
  providers/                 QueryProvider: the only place QueryClient is constructed
  api/
    httpClient.ts            the only fetch caller
    use<Resource>.ts         React Query hooks; keys ['resource', ...ids]
  layouts/                   app shell
  pages/                     route targets; compose containers
  logicalComponents/<Name>/  Container.tsx + index.tsx (the only permitted barrel); fetch and own state
  molecules/<Name>/          Name.tsx, Name.module.css, Name.test.tsx, Name.stories.tsx; props in, markup out
  styles/tokens.css          every visual value; pinned in docs/design-system.md
  vitest.setup.ts
.storybook/
docs/design-system.md        fonts, palette, spacing; open pins (motion, density) listed until decided
```

The template ships one chain through every layer (`useHealth` → `HealthStatus` container → `StatusBadge` molecule) so the first feature has a worked example and depcruise has edges to check. Delete it once a real feature exists.

## Scripts

`dev`, `build`, `typecheck`, `preview`, `test`, `lint`, `lint:css`, `depcruise`, `depcruise:graph`, `storybook`, `build-storybook`, `check`.

## Guards

Everything in `anti-drift.md` marked react-app: hook/client/router/network allowlists, inline style ban, `lint:css`, deep-import ban, frontend depcruise layer rules, hooks rules. Note the options-do-not-merge trap in `anti-drift.md` before adding an ESLint block.

## Rules copied

`common.md`, `frontend.md` (paths `src/**`).

## First feature checklist

- Pin the fonts and palette in `docs/design-system.md` and `tokens.css` before the first molecule. The template's `"TODO"` font is a deliberate placeholder; the banned-defaults list in `frontend.md` applies.
- Every molecule with visual states has a story.
- A hook per resource in `api/`; a container per data-aware view; pages compose, they do not fetch.
- Proxy target in `vite.config.ts` points at the real API.
