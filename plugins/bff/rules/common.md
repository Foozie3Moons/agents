# Common Rules

Apply everywhere. `backend.md` and `frontend.md` add tree-specific rules and win on conflict.

## Design: DDD and OOP

Anything with state or dependencies is a class. Plain functions are for pure calculations only. This holds everywhere, not just where an example happens to show it: clients, services, engines, repositories, gateways, loaders, schedulers, and domain models are classes; a formatter that maps input to output with no collaborators is a function.

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
- No barrel files (`index.ts` re-exports). Import from the source file. ESLint enforces.
- Named domain methods on repositories, never generic CRUD (`findAll`, `findById`, `create`, `update`, `delete`). ESLint enforces for Nest code.

## Security

Before any commit: no hardcoded secrets, all user input validated, error messages leak nothing. Secrets come from environment via the validated config module. If a secret may have been exposed, rotate it.

## Testing

Vitest for Node code (Nest, libraries); Rstest for the frontend. Co-locate tests with source. The standard is: every behavior a task's acceptance criteria names has a test that would fail if it broke. Do not write tests for module shells, DTO definitions, decorator metadata, or generated code. Write the test before the logic when adding logic to a service, repository, or component; skip the ritual for scaffolding.

## Git

Commit format `<type>: <description>` with types feat, fix, refactor, docs, test, chore, perf, ci. No attribution trailers. Branch before committing on main. Agents do not commit unless the task says so.
