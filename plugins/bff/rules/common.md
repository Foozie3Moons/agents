# Common Rules

Apply everywhere. `backend.md` and `frontend.md` add tree-specific rules and win on conflict.

## Design: DDD and OOP

Anything with state or dependencies is a class. Plain functions are for standalone calculations used on their own, not tied to any one class. A helper that serves one class is a method of that class (usually private), even when it is pure; a rule about an entity's own data is a method on the entity. This holds everywhere, not just where an example happens to show it: clients, services, engines, repositories, gateways, loaders, schedulers, mappers and domain models are classes, and a module-level function next to a class it alone serves is a misplaced method. ESLint enforces this in Nest code (`local/no-helper-beside-class`): a file that declares a class declares no module-level functions, exported or not, so a standalone calculation lives in its own file.

- Each module is a self-contained bounded context with explicit boundaries. Other modules reach it only through its published application services and domain types.
- Accept dependencies through the constructor; never construct a collaborator inside the class. In Nest that is constructor injection with `@Inject()` and `useClass` providers, which also makes an override a subclass that replaces one method.
- Hide internal state behind a well-defined interface. Expose behavior, not data: `staples.restock(id, qty)`, not `staples.update(id, { quantity })`.
- One reason to change per class. When a class gains a second responsibility, split it into collaborators.
- Composition over deep inheritance. Subclass to override one method of a provider; do not build hierarchies.
- Business logic lives on domain objects and the services that own them, not in procedural handlers, controllers, or MCP tool factories.
- Interfaces (ports) are defined by the consuming side and implemented by the provider. The consumer owns the contract; the provider adapts to it.
- Entities and value objects in `domain/` carry their own invariants and have no framework imports.

## Code

- Immutability at boundaries: a value that has escaped the function that created it is never mutated. Return a new object. Local mutation inside the creating function is fine.
- Many small files: 200–400 lines typical, 600 cap for Nest code, 800 absolute. Organize by feature, not by type.
- Functions under 50 lines; nesting under 4 levels; no hardcoded values that belong in config.
- Validate at system boundaries with Zod. Never trust API responses, user input, or file content.
- Errors are handled explicitly at every level, never swallowed. User-facing messages are friendly; server logs carry the detail.
- No `any`. Use `unknown` and narrow, or isolate the untyped surface in one gateway file.
- No `console.log` outside scripts and tests. ESLint enforces `no-console`.
- Comments carry their own reason. Do not cite `docs/work/` or a spec's section and row numbers: the working docs are deleted when the feature merges, and the citation then points at nothing. ADRs, runbooks and rules can be cited.
- Prettier formats everything (`.prettierrc.json`: single quotes, 120 columns, trailing commas). A PostToolUse hook formats each file an agent edits; `pnpm format:check` is the gate in CI. Do not hand-format against it.
- No barrel files (`index.ts` re-exports). Import from the source file. ESLint enforces.
- Named domain methods on repositories, never generic CRUD (`findAll`, `findById`, `create`, `update`, `delete`). ESLint enforces for Nest code.

## Security

Before any commit: no hardcoded secrets, all user input validated, error messages leak nothing. Secrets come from environment via the validated config module. If a secret may have been exposed, rotate it.

## Testing

Rstest everywhere (imports from `@rstest/core`). Co-locate tests with source. The standard is: every behavior a task's acceptance criteria names has a test that would fail if it broke. Do not write tests for module shells, DTO definitions, decorator metadata, or generated code. Write the test before the logic when adding logic to a service, repository, or component; skip the ritual for scaffolding.

## Git

Commit format `<type>: <description>` with types feat, fix, refactor, docs, test, chore, perf, ci. No attribution trailers. Branch before committing on main. Agents do not commit unless the task says so.
