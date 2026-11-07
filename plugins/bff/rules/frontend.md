---
paths:
  - "src/frontend/**"
---
# Frontend Rules

React 19 with the React Compiler, Rsbuild (Rspack), React Query, CSS Modules, Storybook (`storybook-react-rsbuild`), Rstest + React Testing Library. Extends `common.md`; wins on conflict. Normative sources: the repo's `docs/decisions/ADR-*.md` for container/presentational, CSS Modules, application shell, data access, styling hygiene, RTL and Storybook (written when the decision is made; until then this file is the rule), and `docs/design-system.md` (tokens, palette, type).

Layout: `layouts/` (app shell), `pages/` (route targets), `logicalComponents/` (containers: fetch and own state), `molecules/` (presentational: props in, markup out). Co-locate `Foo.tsx`, `Foo.module.css`, `Foo.test.tsx`, and `Foo.stories.tsx` for molecules with visual states.

Mechanical enforcement: frontend ESLint config (inline `style={}` ban, hooks rules), `lint:css` (banned generic class names). Run `pnpm --dir src/frontend lint` and `lint:css`.

## Security

React escapes JSX. `dangerouslySetInnerHTML` only with an explicitly sanitized string. No secrets in the bundle.

## Components and Style

### Component Structure

SEPARATE container and presentation concerns:
- Containers own state, data fetching, and event handlers
- Presentation components receive props and render — no fetching, no side effects
- One component per file; filename matches the exported component name

### Component Sizing

KEEP components focused:
- Extract a subcomponent when a render function exceeds ~50 lines
- Extract a custom hook when stateful logic is reused or exceeds ~20 lines
- If a file exceeds ~150 lines, it is doing too much — split it

### Props

DEFINE props as a named interface above the component:

```tsx
interface UserCardProps {
  userId: string;
  onSelect: (id: string) => void;
}

export function UserCard({ userId, onSelect }: UserCardProps) { ... }
```

PREFER discriminated unions over optional props that are only valid together:

```tsx
// Prefer
type ButtonProps =
  | { variant: 'link'; href: string }
  | { variant: 'action'; onClick: () => void };

// Avoid
interface ButtonProps {
  variant: 'link' | 'action';
  href?: string;
  onClick?: () => void;
}
```

### JSX Conventions

- Destructure props in the function signature
- Use explicit `return` for multi-line JSX
- Use early returns for loading / error / empty states before the main render path
- Never use array index as `key` when items can reorder or be removed

### Conditional Rendering

AVOID patterns that cause unnecessary unmount/remount cycles:
- Prefer hiding (`display: none` or opacity) over conditional mounting for frequently toggled UI
- Use conditional mounting for content that is expensive to keep alive when hidden

### Naming

- Components: PascalCase
- Hooks: `use` prefix, camelCase (`useOrderSummary`)
- Event handlers: `handle` prefix (`handleSubmit`, `handleRowSelect`)
- Boolean props: `is` / `has` prefix (`isLoading`, `hasError`)

### Styling — inline styles and class names

ALL styling goes through CSS Modules. JSX `style={}` is banned except for the
CSS-custom-property escape hatch.

#### No JSX `style={}`

Forbidden:

```tsx
<div style={{ padding: "var(--space-3)" }} />                  // pure static — use .module.css
<div style={{ opacity: disabled ? 0.4 : 1 }} />                // state-driven — use :disabled / data-*
```

Permitted (only shape — object whose every key starts with `--`):

```tsx
<div style={{ "--row-height": `${h}px` } as React.CSSProperties} />
```

Remediations:

- **Pure static values** → move to a class rule in the sibling `.module.css`.
- **State-driven values** → use a native pseudo-class (`:disabled`,
  `:hover`, `:focus`), a `data-*` attribute selector, or class composition.
- **Genuinely dynamic runtime values** (measured dimensions, computed
  transforms) → pass via CSS custom property on the element, consume via
  `var(--x)` in the `.module.css` rule.

#### Semantic class names

Class names inside `.module.css` describe the element's role in the
component. Banned exact identifiers:

- `.container`
- `.wrapper`
- `.box`
- `.inner`
- `.outer`

Use component-specific names: `.inputBar`, `.chatPage`, `.messageBubble`,
`.errorPanel`, `.checkboxField`. Stem matches (`.inputContainer`,
`.chatWrapper`) are permitted — the ban is on exact identifier match.

Mechanical enforcement: ESLint rejects inline `style={}` outside the `--`
allowlist; Stylelint (or a grep-check) rejects the five banned identifiers.

## State and Data

### State Management

#### Colocation

Keep state at the lowest owner that needs it. Do not hoist state to a parent until two or more children genuinely share it.

#### Context API

Use Context for values that are stable or change infrequently and are needed across many levels:
- Auth / session
- Theme / locale
- Feature flags

Do NOT use Context as a general state manager. It re-renders all consumers on every change — use it for low-frequency values or values that rarely change.

For server state, React Query is the source of truth. Do not duplicate server state into Context or `useState`.

#### State Machines for View Screens

For multi-screen or multi-step views, use a union type + explicit state variable:

```tsx
type Screen = 'list' | 'detail' | 'confirm'
const [screen, setScreen] = useState<Screen>('list')
```

Avoids boolean flag accumulation (`isEditing`, `isConfirming`, `isDeleting`).

### Compound Component Pattern

Use when a component has multiple sections that share implicit state or context and are always rendered together:

```tsx
<DataTable>
  <DataTable.Toolbar />
  <DataTable.Body />
  <DataTable.Pagination />
</DataTable>
```

Implement via a Context provider inside the parent + named sub-components attached as properties. Avoids deeply nested prop drilling within a single UI unit.

### Data Fetching

ALL data fetching goes through React Query. No raw `useEffect` fetching.

Query key conventions:
```tsx
// Entity list
queryKey: ['orders']

// Parameterized
queryKey: ['orders', orderId]
queryKey: ['orders', { status, page }]
```

Always encapsulate `useQuery` / `useMutation` in a named hook — components never call React Query directly.

Pagination: use `skip` / `limit` or `page` / `pageSize` as query params. Use `useInfiniteQuery` for scroll-based pagination; standard `useQuery` with explicit page state for paginated tables.

Always handle all three states where data is fetched:
- Loading: skeleton or spinner
- Error: visible error state with recovery hint
- Data: main content

### Responsive Layout

Do NOT use JavaScript to detect screen size for layout decisions. Use CSS media queries or container queries. Reserve `useResizeObserver` / `useWindowSize` for cases that genuinely require JS-side dimensions (canvas, virtualization row height).

### Image Handling

Components that render images must handle the missing / loading state: skeleton, neutral placeholder, or explicit empty state. Never render a broken `<img>` tag.

## Hooks

### Rules of Hooks

- Only call hooks at the top level — never inside loops, conditions, or nested functions
- Only call hooks from React components or other custom hooks
- All custom hooks use the `use` prefix

### When to Extract a Custom Hook

Extract logic into a custom hook when:
- The same stateful logic is needed in 2+ components
- A component contains data fetching, side effects, or non-trivial derived state
- A component's logic exceeds ~20 lines alongside its render

Keep hooks in a `hooks/` directory colocated with the feature, or in a shared `hooks/` package for cross-feature hooks.

### Effect Discipline

`useEffect` is for synchronizing with external systems — not for deriving state:

```tsx
// Wrong: filtering in an effect
useEffect(() => {
  setFiltered(items.filter(i => i.active));
}, [items]);

// Right: derive inline
const filtered = items.filter(i => i.active); // the compiler memoizes this
```

```tsx
// Wrong: resetting state on prop change via effect
useEffect(() => { setPage(0); }, [filters]);

// Right: use key prop to reset component state
<ResultsTable key={filterHash} filters={filters} />
```

Valid `useEffect` uses: syncing to localStorage, setting up subscriptions, triggering imperative DOM APIs on mount.

### Memoization

The React Compiler is on (`pluginReact({ reactCompiler: true })` in `rsbuild.config.ts`). It owns memoization.

- Do NOT write `useMemo`, `useCallback`, or `React.memo`. The compiler inserts the equivalent where the code follows the Rules of React; hand-written memoization is noise it has to reason around.
- Write components and hooks the compiler can optimize: pure render, no mutation of props/state/values after creation (common.md §Immutability), hooks at the top level. `react-hooks/rules-of-hooks` and `exhaustive-deps` are errors.
- A component the compiler skips (it bails out silently on rule violations) is fixed by fixing the violation, not by adding `useMemo`.
- `useRef` stays for mutable values that must not trigger re-renders (timers, previous values, imperative handles).
- A measured performance problem that survives the compiler is a task with a profile attached, and the fix is named in the brief; it is not a reason to hand-memoize on sight.

### Derived State Must Not Live in the Cache

Query caches hold **raw server data only**. View-layer classifications — active/inactive splits, visibility flags, filtered subsets, sorted orders — are never stored in query cache shape or as separate cache entries.

Derived state is computed at render time from cached raw data using pure functions.

#### Canonical pattern

```typescript
// ✅ Cache holds raw data
queryClient.setQueryData(['resource', id], rawItems: Map<string, Item>)

// ✅ Derived state computed in component or custom hook
const visibleItems = computeVisible(rawItems) // pure function; the compiler memoizes

// ❌ Never classify into view buckets inside cache
{ activeItems: Item[], inactiveItems: Item[] }  // wrong cache shape

// ❌ Never patch view state during mutations
onMutate: () => {
  // moving items between active/inactive arrays — wrong
}
```

#### Mutations patch raw fields only

Optimistic updates set exactly the field the API call changes (e.g. `status`, `assignee`). They do not reclassify, reorder, or restructure the cached data. The view recomputes from the patched raw value on next render.

#### One cache target per mutation

A mutation invalidates the single cache entry that owns the changed resource. Bulk/aggregate caches (e.g. a full-list seed cache) are populated on initial fetch only and are never patched by mutations.

## Testing

### Tooling

- **Runner**: Rstest (`@rstest/core`), reusing `rsbuild.config.ts` through `@rstest/adapter-rsbuild`; jsdom environment; `rstest.setup.ts` registers jest-dom matchers and RTL cleanup. Test APIs import from `@rstest/core` (Jest-compatible: `describe`, `it`, `expect`, `rs.mock`).
- **Components**: React Testing Library
- **Hooks**: `renderHook` from RTL
- **API mocking**: msw — do not mock `fetch` or axios directly
- **React Query**: wrap in `QueryClientProvider` with a fresh `QueryClient` per test

### What to Test

Test behavior, not implementation:
- User interactions (clicks, keyboard input, form submission)
- Conditional rendering (loading / error / data states)
- Data transformations surfaced to the UI (filtering, sorting, derived labels)
- Navigation flows between screens or views

### What Not to Test

- React Query's internal caching or refetch behavior
- Third-party library internals
- Exact style values or class names
- Implementation details of hooks (internal state shape, intermediate values)

### Queries

Prefer accessible queries in this order: `getByRole`, `getByLabelText`, `getByText`, `getByTestId`. Use `getByTestId` only as a last resort — it couples tests to implementation structure.

### Async

Use `waitFor` / `findBy*` for async state updates. Do not use arbitrary `setTimeout` or `act` wrappers to paper over async behavior.

### Mocking

Mock at system boundaries:
- API: msw handlers, not module mocks of fetch clients
- Modules: only when the module has an unavoidable side effect (e.g. a native dependency)
- Time: `vi.useFakeTimers()` for debounce / throttle / polling tests

### Hook Testing

Test custom hooks via `renderHook`:
- Test state transitions and returned values, not internal implementation
- Always wrap in required providers (`QueryClientProvider`, context providers)
- Clean up between tests — use `afterEach(() => queryClient.clear())`

### React Query Setup

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Set `retry: false` in tests — default retry behavior causes slow, flaky tests on error cases.

## Aesthetics

### Banned Defaults

Use: a deliberately-chosen font pinned by `docs/design-system.md`, a deliberately-chosen palette pinned in the same file, and CSS that matches the product's identity. For any concern not yet chosen, do not invent a default. Ask the user, or defer the surface.

Do not use:
  - `font-family: "Inter", sans-serif` — Inter is the default tutorial font and signals "generic SaaS" rather than the product.
  - `font-family: "Roboto", sans-serif` — same reason.
  - `font-family: Arial, sans-serif` — 1990s web-safe default.
  - `font-family: system-ui, -apple-system, "Segoe UI", Roboto, ...` — the "system font stack" advertised as best practice; produces a look that changes by OS and has no product identity. The ban applies to `system-ui` and `-apple-system` as primary or prominent fallback tokens — i.e. when they would take effect on common OSes. A generic last-resort chain terminator (`"Helvetica Neue"`, `Helvetica`, `Arial`, `sans-serif`) after the chosen primary web font is permitted; the banned stack is the one that leads with `system-ui` or surfaces it before a generic keyword.
  - Purple-to-pink or blue-to-purple gradients on white backgrounds — the dominant AI-generated-marketing-page aesthetic. Banned as identity-diluting even if the gradient itself is technically well-executed.
  - Any component-library default theme applied without a deliberate product theme layer on top. If a library's default ships a purple accent and an Inter font, that is the wrong default, not a starting point.

Why the wrong patterns are tempting: every frontend tutorial, every component-library README, and every LLM-generated starter template reaches for these defaults. They are what the open internet has trained agents (and engineers) to produce. Without an explicit ban, the dashboard will drift into AI-slop aesthetic on autopilot.

Failure mode: visual identity collapse — the dashboard looks like every other Tailwind-starter-plus-shadcn project on the internet. Not a crash, not a bug, just a product that looks like it was generated rather than designed. Equally bad: several subagents each reach for slightly different defaults, and the product visibly fractures across surfaces.

Mechanical enforcement: review only. The linter cannot catch "is this gradient AI-slop." Pre-merge review for any new `.css`/`.module.css` file or inline style cluster should check this section. A future lint rule could ban the literal strings `"Inter"`, `"Roboto"`, and `system-ui` in CSS files, but that is not required and not in this spec's scope.

### No New Top-Level Frontend Dependencies Without a Task

Use: the dependencies already in the frontend `package.json`. If a new surface needs motion, icons, typography loading, or styling utilities, stop and flag.

Do not use: `pnpm add <anything>` in the frontend tree unless the dispatched task brief explicitly names the dependency and the reason. "The component looks better with Motion" is not authorization. "The task brief says add Motion for the transition spec in §X" is.

Why the wrong pattern is tempting: animation libraries, icon libraries, and styling utilities advertise as zero-friction additions. Every component-library tutorial adds three packages between "open the editor" and "write the first component." The friction of a dedicated task feels like overhead.

Failure mode: frontend surface area explodes. Each task adds their own motion library, their own icon set, their own CSS-in-JS runtime. Bundle size doubles. Visual identity fractures (see Banned Defaults above). Dependency upgrades become a multi-agent coordination problem.

Mechanical enforcement: review only. A pre-commit hook that diffs `package.json` and flags frontend additions is a candidate for a future task but is not required here. The dispatcher (main session) is expected to reject dispatched work that adds an un-briefed dependency.

### Cohesion

One product, one aesthetic. When a visual choice exists in the codebase (a color, a spacing value, a type weight, a button shape), reuse it. A change that introduces a second variant of an existing choice is rejected in review.

### Open Questions

The following pins are deferred. Until they are chosen, no surface should invent a default — ask the user or defer the feature. When each is decided, update the relevant section above and remove the entry from this list.

1. **Motion.** The easing curves, durations, and animation patterns have not been chosen. The decision about whether to adopt a motion library at all (see "No New Top-Level Frontend Dependencies") also falls under this pin. Until then, do not commit a `transition` or `animation` declaration.
2. **Density.** The spacing scale (4px? 8px? hybrid?) and base density (compact / comfortable / spacious) have not been chosen. Until then, do not commit a new spacing value; match an existing one or defer.

Each pin, when resolved, lands as an edit to this file (move the decision into the relevant section, delete the Open Question entry). No ADR is required for the individual pins unless the decision carries long-term architectural weight beyond "we picked X."
