---
paths:
  - "src/backend/**/*.ts"
  - "src/backend-for-frontend/**/*.ts"
---
# Backend Rules

NestJS, better-sqlite3 (or Postgres behind the same repository shape). Extends `common.md`; wins on conflict. Normative sources, when the repo has them: `docs/layering-rulebook.md` and `docs/decisions/ADR-*.md`. Until the repo writes those, this file is the rule.

Mechanical enforcement: `eslint-plugin-boundaries` (layer edges), `eslint-rules/*.cjs` (repository shape, `@Inject`, SQL interpolation, env access, cross-domain writes), dependency-cruiser (cycles, orphans, cross-tree edges). Run `pnpm lint` and `pnpm depcruise`.

## Layering

Pocket reference. If the repo has `docs/layering-rulebook.md` and a layered-architecture ADR, those win on conflict; this file is the quick reference agents read first.

### Five-Layer Module Structure (§3)

Every module under `src/backend/<module>/` and every BFF feature under
`src/backend-for-frontend/<feature>/` uses this directory structure:

```
src/backend/<module>/
├── api/           (1) @Controller endpoints and @MessagePattern handlers — inbound only
├── use-case/      (2) OPTIONAL — composite workflows spanning multiple application services
├── application/   (3) Single-transaction orchestration; one service owns one business operation
├── data-access/   (5) Repositories (SQLite) and outbound gateways (HTTP/SDK clients)
└── domain/        (4) Entities, value objects, pure business rules — no I/O, no Nest imports
```

Layers are numbered 1→5 in the direction allowed imports flow. A higher-numbered layer never
imports from a lower-numbered one. Layer skipping is forbidden — `api/` must not reach
`data-access/` directly even if the application service is a one-line passthrough. Write the
passthrough. Any layer a module does not need may be omitted.

### Intra-Module Dependency Arrows (§3.6)

```
api ──▶ use-case ──▶ application ──▶ data-access ──▶ domain
 │         │              │               │             ▲
 └─────────┴──────────────┴───────────────┴─────────────┘
              (all layers may import domain directly)

core ◀── any layer, any module (§4.2)
```

Specific constraints:

- `api/` imports from `use-case/` (if present) or `application/`, plus `domain/` and `core/`.
- `use-case/` imports from `application/`, `domain/`, `core/`. Never `data-access/`. Never a peer `use-case/`.
- `application/` imports from `data-access/`, `domain/`, `core/`. Never `api/`, `use-case/`, or a peer `application/` in the same module.
- `data-access/` imports from `domain/` and `core/` only. May `import type` from foreign modules' `domain/` (§3.7).
- `domain/` imports from `core/types/*` only — pure types and utilities, nothing stateful.

### Cross-Module Rules (§3.7)

A module is opaque except through two surfaces: its `application/` services and its `domain/` types.

| From module A → module B                  | Allowed? |
|-------------------------------------------|----------|
| `a/application/*` → `b/application/*`    | Yes — the only behavioral cross-module call |
| Any layer of A → `b/domain/*`            | `import type` only — published language |
| Any layer of A → `b/api/*`              | No — API is inbound surface |
| Any layer of A → `b/use-case/*`          | No — UseCases are private composition |
| Any layer of A → `b/data-access/*`       | No — Data Access is private storage |

Domain values (instances) enter module A only as return values from B's `application/` services.
Module A may hold references and pass them back to B, but may not construct them.

### Cross-Tree Rules (§3.8)

BFF (`src/backend-for-frontend/`) is strictly downstream of the backend.

| Direction | Allowed? |
|-----------|----------|
| `bff/<feature>/*` → `backend/<module>/use-case/*` | Yes — use-cases are Application Services (DDD) |
| `bff/<feature>/*` → `backend/<module>/application/*` | Yes — single-transaction services |
| `bff/<feature>/*` → `backend/<module>/domain/*` | `import type` only |
| `bff/<feature>/*` → `backend/<module>/{api,data-access}/*` | No |
| `backend/<module>/*` → `bff/*` | No — backend does not know BFF exists |

**DDD rationale**: Use-cases are Application Services in DDD terms — the public API of a bounded
context. BFF (as an anti-corruption layer) consumes them directly. No facade wrappers needed.

The BFF has its own internal layering with the same five-layer structure. Intra-BFF cross-feature
rules mirror §3.7 exactly: `bff-application → bff-application` is allowed; reaching into another
feature's `api/`, `use-case/`, or `data-access/` is forbidden.

### Transport (§4.1)

`src/backend/transport/` holds long-running **inbound** adapters (a bot framework, a queue consumer,
a websocket server). These are not module layers.

- Transports know nothing about any module's internals.
- They dispatch into `api/` handlers via `@MessagePattern`; they may `import type` from `api/` DTOs.
- Transports may import from `core/` only — no module `use-case/`, `application/`, `data-access/`, or `domain/`.
- No module may import from a transport. The transport → module direction is the only legal edge.

### Core (§4.2)

`src/backend/core/` holds cross-cutting infrastructure: config, logging, `DB_CONNECTION` provider,
migration runner, global exception filters, framework-level value-object base classes.

- Any layer of any module, and any transport, may import from `core/`.
- `core/` may not import from any module, transport, or BFF tree.
- `domain/` is limited to `core/types/*` (pure types and utilities — see §3.4). It must not import
  `core/config`, `core/logging`, `core/database`, or any other stateful `core/` subpath.

### D1 Vocabulary

**Gateway** — owns the external system's wire handle (SDK client, HTTP transport, socket). One
gateway per external system. Always in `data-access/`. Named `<system>.gateway.ts`. The gateway is
the single point all traffic to that system passes through — there is no second path.

**Adapter** — implements a port interface (`*.port.ts` from `domain/`) but does not itself own a
wire handle. Layer placement is determined by imports, not by the word "adapter":
- If it only translates types and maps errors between a port and a single gateway in the same module
  → `data-access/`, co-located with the gateway.
- If it routes across multiple ports, makes cross-module application calls, or composes behavior
  across more than one data-access dependency → `application/`. The layer rules force this: `data-access/`
  cannot legally import peer `application/` services.

**Use-case** — composes **multiple application services** across a composite workflow (multi-step
sagas, transactional choreography). A use-case whose body calls only one application service is not
a use-case — delete it and call the application service from `api/` directly (§3.2). A single-port
decorator that wraps cross-cutting logic around one port is not a use-case either; that logic belongs
in the gateway (see D2 below).

### D2 Unbypassable Concerns — Must Live in the Gateway

A decorator or use-case sitting above a port can always be bypassed by injecting the underlying
class directly. The gateway is the only class that owns the wire, so it is the only class that
guarantees 100% policy coverage. **Never hold unbypassable policy in a decorator or use-case.**

Typical unbypassable concerns: outbound payload redaction or sanitization before data crosses a
trust boundary (fail-closed: a redaction failure halts the call), usage and cost recording for metered
APIs (tokens, dollars, request counts) at the wire, per-system rate limiting and retry policy. The
test for redaction: "does this call put user bytes on a network interface headed somewhere the user
does not control?" If yes, the gateway handles it. Calls to local processes are exempt. Each of these
happens inside the gateway's send method, not in a service or use-case above it.

## Coding Style

### Dependency Injection

Constructor injection only. No property injection. No service locator pattern.

```typescript
// CORRECT
@Injectable()
export class StapleService {
  constructor(
    private readonly staples: StapleRepository,
    private readonly logger: Logger,
  ) {}
}

// WRONG
@Injectable()
export class StapleService {
  @Inject(StapleRepository) private staples: StapleRepository;
}
```

Dependencies are typed by class or by injection token (Symbol). String tokens only when interfacing with Nest built-ins that require them.

```typescript
// Injection tokens
export const DB_CONNECTION = Symbol('DB_CONNECTION');
export const CLOCK = Symbol('CLOCK');

// Usage
constructor(
  @Inject(DB_CONNECTION) private readonly db: DbConnection,
  @Inject(CLOCK) private readonly clock: Clock,
) {}
```

### Module Organization

One bounded context per module. Each module lives at `src/backend/<module>/` (or `src/backend-for-frontend/<feature>/` for BFF features). The module file sits at the module root — not inside a layer subdirectory.

```
src/backend/<module>/
├── <module>.module.ts       # Nest module declaration — lives at root, not in a layer
├── api/                     # @Controller endpoints, @MessagePattern handlers, DTOs, request validation
├── use-case/                # OPTIONAL — composite workflows spanning multiple application services
├── application/             # Single-transaction orchestration; one service per business operation
├── data-access/             # Repositories (SQLite) and outbound gateways (HTTP/SDK clients)
└── domain/                  # Entities, value objects, pure business rules — no I/O, no Nest imports
```

Layers may be omitted if the module does not need them. Modules export only application services and domain types that other contexts genuinely need. Repositories, gateways, and use-case classes stay private. Cross-context behavioral calls go through exported application services only.

### No Barrel Files

See `common.md`. Nest-specific failure mode: barrel re-exports resolve at class-declaration time, so a circular barrel produces an `undefined` provider at boot with no useful stack. ESLint bans `ExportAllDeclaration` in `**/index.ts`.

### Decorators

Decorators belong above the symbol they apply to, one per line. Order: framework decorators (@Injectable, @Controller) first, then routing/metadata decorators (@Get, @MessagePattern), then parameter decorators inline.

```typescript
@Controller('staples')
export class StaplesController {
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Staple> {
    return this.service.findById(id);
  }
}
```

### File Length

400 lines is the soft target, 600 is the cap. Nest controllers and modules are usually well under this; if a service is approaching 600, split by responsibility.

### Line Length

100 characters. Constructor parameter lists often exceed this — break onto multiple lines with one parameter per line.

### Logger

Inject Nest's `Logger` from `@nestjs/common`. Never `console.log`.

nestjs-pino replaces Nest's built-in `Logger` app-wide via `app.useLogger(...)` in `main.ts`, so `private readonly logger: Logger` gives you pino output with the correct module context. This is the only supported logger injection in module code.

```typescript
import { Logger } from '@nestjs/common';

export class StapleService {
  private readonly logger = new Logger(StapleService.name);

  // ...

  this.logger.debug({ skillId, sessionId }, 'skill invoked');
  this.logger.error({ err }, 'sanitizer failed');
}
```

**Do not use `@InjectPinoLogger` or import `PinoLogger` from `nestjs-pino` in module code.** They require per-module `LoggerModule.forFeature([...])` registration that the global `LoggingModule` cannot provide. A service that injects a pino logger without its owning module registering `forFeature` crashes Nest at boot with `UnknownDependenciesException`. The only legitimate `nestjs-pino` imports are `LoggerModule` inside `src/backend/core/logging/` and `Logger` inside `src/backend/main.ts` for `app.useLogger(...)`. An ESLint rule enforces this.

Never log raw user message content. Log structured fields (ids, counts, durations) instead.

#### `console.log` outside scripts

Wrong pattern:

```typescript
// in src/backend/bot/application/chat.service.ts
console.log('processing message', message.text);
```

Why tempting: fastest way to debug; muscle memory from non-Nest work.

Failure mode: output bypasses nestjs-pino, loses structured fields (request id, module context, log level), breaks JSON log parsing in production, and will log raw message content if careless — violating the "never log raw user message content" rule silently.

Mechanical enforcement: `no-console: 'error'` in `eslint.config.cjs`, disabled for `**/*.test.ts`.

Correct alternative: `private readonly logger = new Logger(ClassName.name)` from `@nestjs/common`.

#### Vendor SDK imported outside its gateway

Wrong pattern:

```typescript
// in any file except src/backend/<system>/data-access/<system>.gateway.ts
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

Why tempting: the SDK README shows direct instantiation; every vendor example does it.

Failure mode: the import compiles, but every D2 concern the gateway owns (redaction, usage recording, rate limiting) is bypassed with no error. The same applies to a single function from an SDK that is the egress path (for example `query()` from `@anthropic-ai/claude-agent-sdk`).

Mechanical enforcement: `no-restricted-imports` in `eslint.config.cjs`, one entry per external system (whole package, or `importNames` for the egress function), with a `files:` override that turns the rule off for exactly the gateway file. Add the entry the same day the SDK is added to `package.json`.

Correct alternative: inject the gateway, or the port it implements from the module's `domain/`.

### Async

`async`/`await` everywhere. Never mix with `.then()`. Even when wrapping a synchronous library (better-sqlite3 is synchronous), repository methods are declared `async` so the calling API stays consistent.

### Error Handling

Throw typed errors from repositories and services. Translate to `HttpException` subclasses only at the controller layer.

```typescript
// Repository
export class SessionNotFoundError extends Error {
  constructor(public readonly sessionId: string) {
    super(`Session not found: ${sessionId}`);
  }
}

// Service - lets typed error bubble
async getSession(id: string): Promise<Session> {
  const session = this.sessions.findById(id);
  if (!session) throw new SessionNotFoundError(id);
  return session;
}

// Controller - translates to HTTP
@Get(':id')
async getOne(@Param('id') id: string) {
  try {
    return await this.service.getSession(id);
  } catch (err) {
    if (err instanceof SessionNotFoundError) throw new NotFoundException(err.message);
    throw err;
  }
}
```

Never silently swallow errors. Never catch and re-throw without adding context.

### No `any`

Wrong pattern:

```typescript
function process(data: any) { ... }
const result = response as any;
```

Why tempting: the TypeScript compiler stops complaining immediately.

Failure mode: type errors move from compile time to runtime; a type-unsafe surface in one layer propagates unsafely across all callers. An `any` that escapes a function boundary infects every downstream consumer with the same loss of type safety.

Mechanical enforcement: `@typescript-eslint/no-explicit-any: 'error'` in `eslint.config.cjs`.

Correct alternative: use `unknown` with explicit narrowing before use, or isolate the untyped surface behind a typed wrapper in a single file (e.g., a gateway) so `any` never crosses a module boundary.

```typescript
// CORRECT — isolate at the boundary, narrow before use
function parseResponse(raw: unknown): ApiResult {
  if (!isApiResult(raw)) throw new Error('Unexpected response shape');
  return raw;
}
```

#### String-Interpolated SQL

Wrong pattern:

```typescript
const results = db.prepare(`SELECT * FROM users WHERE id = ${userId}`).all();
```

Why tempting: feels like template literals everywhere else; single-line convenience with no extra syntax.

Failure mode: SQL injection. String interpolation lets any caller-controlled value alter the query structure. Parameterized queries are the only defense; there is no sanitization layer that reliably substitutes for them.

Mechanical enforcement: `eslint-rules/no-interpolated-sql.cjs` flags any `prepare(` call whose template literal contains `${...}`.

Correct alternative: parameterized query with `?` positional or `@name` named placeholders.

```typescript
// CORRECT
const findUser = db.prepare('SELECT * FROM users WHERE id = ?');
const results = findUser.get(userId);
```

#### Env Vars Outside `core/config`

Wrong pattern:

```typescript
// in src/backend/bot/application/chat.service.ts
const apiKey = process.env.ANTHROPIC_API_KEY;
```

Why tempting: works immediately; no import or injection needed.

Failure mode: the env var is accessed before Zod validation runs. A missing or malformed var causes a runtime `undefined` dereference at the call site — often deep inside a request handler — instead of a clean boot failure with a readable Zod error. Config validation fails closed (§AppConfig in `src/backend/core/config/`); bypassing it means the app boots successfully and fails mysteriously later.

Mechanical enforcement: `eslint-rules/no-process-env-outside-config.cjs`.

Correct alternative: inject `AppConfig` via the `APP_CONFIG` token. The value has already been Zod-validated at boot.

```typescript
// CORRECT
constructor(
  @Inject(APP_CONFIG) private readonly config: AppConfig,
) {}
```

## Patterns

### Repository Pattern

Repositories use **named domain methods**, not generic CRUD. A generic `Repository<T>` interface is never used.

```typescript
// CORRECT - named domain methods
@Injectable()
export class StapleRepository {
  private readonly findByName: Statement<[string], StapleRow>;
  private readonly insertStaple: Statement<[StapleInsert]>;
  private readonly markPurchased: Statement<[number, number]>;

  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {
    this.findByName = db.prepare('SELECT * FROM staples WHERE name = ?');
    this.insertStaple = db.prepare('INSERT INTO staples (name, category, quantity, unit) VALUES (@name, @category, @quantity, @unit)');
    this.markPurchased = db.prepare('UPDATE staples SET quantity = ?, updated_at = ? WHERE id = ?');
  }

  async byName(name: string): Promise<Staple | null> {
    const row = this.findByName.get(name);
    return row ? this.toEntity(row) : null;
  }

  async restock(stapleId: number, quantity: number): Promise<void> {
    this.markPurchased.run(quantity, Date.now(), stapleId);
  }
}

// WRONG - generic CRUD
export class StapleRepository implements Repository<Staple> {
  findAll(): Promise<Staple[]> { ... }
  findById(id: string): Promise<Staple> { ... }
  create(data: CreateDto): Promise<Staple> { ... }
}
```

Why: generic CRUD leaks "this is a database table" into every consumer. Named methods document intent at the call site (`staples.restock(id, qty)` reads better than `staples.update(id, { quantity: qty })`) and let you change implementation without changing the interface.

Why tempting: the `Repository<T>` generic is the shape every TypeORM / Prisma / Sequelize tutorial ships with; pattern-matching on ORM documentation leads straight to `class XRepository implements Repository<X>`.

Failure mode: generic CRUD leaks storage implementation into every consumer; a `findById` that returns `null` on a not-found looks identical to one that returns `null` on an error, which means callers cannot handle the two cases differently.

Mechanical enforcement: the custom ESLint rule `eslint-rules/no-generic-repository.cjs` (wired in `eslint.config.cjs` under `src/backend/**` and `src/backend-for-frontend/**`) flags both `import { Repository }` and `class X implements Repository<...>` inside Nest modules. Test files are excluded.

### No Cross-Domain Writes

Application services do not write to another domain's tables.

**Correct:** a service constructor-injects only its own module's repositories and `DB_CONNECTION`. `RecordReceiptService` writes to `receipts` only. If restocking freezer staples is also needed, the agent makes a separate tool call to `InventoryService.restock` — it does not happen inside `RecordReceiptService.record`.

```typescript
// CORRECT
@Injectable()
export class RecordReceiptService {
  constructor(private readonly receipts: ReceiptRepository) {}

  async record(input: ReceiptInput): Promise<void> {
    await this.receipts.insert(input);
    // Inventory restock is the agent's responsibility via a separate call.
  }
}
```

**Wrong:** a service in domain A constructor-injects domain B's service and calls a mutating method on it.

```typescript
// WRONG
@Injectable()
export class RecordReceiptService {
  constructor(
    private readonly receipts: ReceiptRepository,
    private readonly inventory: InventoryService,
  ) {}

  async record(input: ReceiptInput): Promise<void> {
    await this.receipts.insert(input);
    await this.inventory.restock(input.items); // cross-domain write
  }
}
```

Why tempting: "do-it-all" transactional handlers are the default shape in most frameworks; calling `InventoryService.restock` from `RecordReceiptService.record` reads as a natural convenience and hides the cross-domain write behind a single operation.

Failure mode: cross-module writes mean a change to inventory's schema breaks receipts, a restock bug corrupts the receipts audit trail, and "who wrote this row?" becomes unanswerable without tracing across modules.

Mechanical enforcement: `eslint-rules/no-cross-domain-writes.cjs`. In a domain module's `application/`, a constructor-injected service imported from another domain's `application/` may be called for reads; a call to a method named with a mutating verb (`create`, `insert`, `update`, `delete`, `remove`, `set`, `add`, `mark`, `restock`, `record`, `archive`, `patch`, `upsert`, `save`, `clear`, `toggle`) is an error. Name read methods accordingly (`ensureExists`, `findById`, `hydrateTags`).

This rule and its ESLint enforcement apply only when the repo groups bounded contexts under `src/backend/domains/<name>/`. Record exceptions in an ADR.

### Prepared Statements

Statements are constructed once in the repository constructor and stored as `private readonly` fields. Never construct prepared statements inline in methods. Each statement gets a name that describes what it does.

```typescript
// CORRECT
constructor(@Inject(DB_CONNECTION) db: DbConnection) {
  this.findActiveSessions = db.prepare('SELECT * FROM sessions WHERE archived_at IS NULL');
  this.archiveSession = db.prepare('UPDATE sessions SET archived_at = ? WHERE id = ?');
}

// WRONG
async getActive() {
  return this.db.prepare('SELECT * FROM sessions WHERE archived_at IS NULL').all();
}
```

### No ORM

better-sqlite3 only. Never introduce TypeORM, Prisma, MikroORM, Drizzle, or any other ORM. The repository pattern above is the abstraction.

### Service Layer

Services orchestrate repositories. Repositories never call other repositories. If cross-aggregate consistency is needed, the service opens a transaction:

```typescript
@Injectable()
export class GroceriesService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly staples: StapleRepository,
    private readonly receipts: ReceiptRepository,
  ) {}

  async recordReceipt(input: ReceiptInput): Promise<void> {
    const tx = this.db.transaction((input: ReceiptInput) => {
      const receiptId = this.receipts.insert(input);
      for (const item of input.items) {
        this.staples.restock(item.stapleId, item.quantity);
      }
      return receiptId;
    });
    tx(input);
  }
}
```

better-sqlite3's `db.transaction()` is synchronous and automatic — the function inside runs in a transaction that commits on return or rolls back on throw.

### API Response Format

Nest-idiomatic. Return raw data on success. Throw `HttpException` subclasses on error. No `{success, data, error}` envelope.

```typescript
// CORRECT
@Get(':id')
async getOne(@Param('id') id: string): Promise<Session> {
  const session = await this.sessions.findById(id);
  if (!session) throw new NotFoundException(`Session ${id} not found`);
  return session;
}

// WRONG
@Get(':id')
async getOne(@Param('id') id: string): Promise<ApiResponse<Session>> {
  const session = await this.sessions.findById(id);
  if (!session) return { success: false, error: 'Not found' };
  return { success: true, data: session };
}
```

Why: Nest's exception filters serialize HttpException subclasses to standard HTTP error responses with correct status codes. Wrapping in an envelope means writing an interceptor on every controller, breaks Swagger/OpenAPI integration, and forces every consumer to unwrap before using the data. The envelope was a frontend convenience pattern; it's the wrong default for a Nest backend.

### DTOs and Validation

Use Zod schemas for request body and response validation. Define DTOs at the controller boundary. Never leak internal entity types directly to the wire — even when they happen to match, define a DTO so future internal changes don't accidentally break the API.

```typescript
const CreateSessionDto = z.object({
  chatId: z.number().int(),
  userId: z.number().int(),
  skillId: z.string(),
});
type CreateSessionDto = z.infer<typeof CreateSessionDto>;

@Post()
async create(@Body(new ZodPipe(CreateSessionDto)) body: CreateSessionDto) {
  return this.service.createSession(body);
}
```

### Lifecycle Hooks

Use Nest lifecycle interfaces explicitly. Common ones:

- `OnModuleInit` — for setup that needs other providers already constructed
- `OnApplicationBootstrap` — for setup that needs the entire app ready (e.g. a registry scanning all providers)
- `OnApplicationShutdown` — for cleanup: closing transports, the SQLite connection, outbound clients

```typescript
@Injectable()
export class ToolRegistry implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    // scan providers via DiscoveryService
  }
}
```

### Custom Transports

Custom Nest transports (under `src/backend/transport/<name>/`) extend `Server` and implement `CustomTransportStrategy`. Read the Nest microservices documentation before writing one. Get the lifecycle right: `listen()` starts and reports success/failure via the callback; `close()` stops cleanly.

### Immutability scope

The immutability rule in `common.md` applies to public surfaces: service return values, payloads to other modules, controller responses. Repository internals, prepared-statement params, builders inside one function, and local objects that haven't escaped are exempt. Returning a mutated input parameter is not.

## Modules

How to structure a bounded context module.

### One Bounded Context, One Module

Each bounded context lives under `src/backend/<module>/` with its module file at the root:

```
src/backend/bot/bot.module.ts
src/backend/skills/skills.module.ts
src/backend/llm/llm.module.ts
src/backend/domains/groceries/groceries.module.ts
src/backend-for-frontend/dashboard.module.ts
```

A module declares the providers, controllers, and exports for its bounded context. It does NOT declare providers from other contexts — it imports them via other modules.

### Module Anatomy

The module file sits at the module root. Providers are drawn from the layered subdirectories. `exports:` is limited to application services (behavioral surface), domain types (published language), and port interfaces — never repositories, gateways, or internal use-case classes (§4.7 of the layering model).

```typescript
// src/backend/domains/groceries/groceries.module.ts
@Module({
  imports: [
    DatabaseModule,        // for DB_CONNECTION
    LlmModule,             // for LLM application services
  ],
  providers: [
    // data-access/ — repositories and outbound gateways
    StapleRepository,
    ReceiptRepository,
    // application/ — single-transaction orchestration
    GroceriesService,
    RecordReceiptService,
  ],
  controllers: [
    // api/ — HTTP endpoints and @MessagePattern handlers
    // GroceriesController (if this context exposes HTTP handlers)
  ],
  exports: [
    // Only application services and domain types other modules need.
    // Repositories and gateways stay private.
    GroceriesService,
  ],
})
export class GroceriesModule {}
```

### Export Discipline

Export the minimum surface area. Repositories stay private to the module unless another bounded context genuinely needs direct access (rare — usually they should go through a service). Services are exported when other contexts call them.

If you find yourself exporting a repository, ask: should this be a service method instead?

### Imports

Import other modules, not their providers directly. Nest's DI resolves the providers through the module graph.

```typescript
// CORRECT
@Module({
  imports: [GroceriesModule],
  providers: [CookingService],  // CookingService can inject GroceriesService
})

// WRONG
@Module({
  providers: [
    CookingService,
    GroceriesService,           // duplicating a provider from another module
  ],
})
```

Importing a module multiple times across the graph is fine — Nest deduplicates and singletons stay singletons.

### Global Modules

Use `@Global()` sparingly. Justified for: `ConfigModule`, `LoggingModule`, possibly `DatabaseModule`. NOT justified for domain modules — making `GroceriesModule` global hides the dependency relationship and lets unrelated code reach into it.

### Forward References

`forwardRef()` is a fallback for circular dependencies, not a default. If you need it, the design is probably wrong. Try first:

1. Extract the shared piece to `shared/`
2. Invert one dependency direction (often the "lower" module shouldn't depend on the "higher" one)
3. Define an interface in the dependent module that the dependency module implements

Only after these fail, use `forwardRef`. When you do, document why in a comment above the import.

### Dynamic Modules

Use dynamic modules (`forRoot()`, `forFeature()`) when a module needs configuration at registration time. The `DatabaseModule.forRoot({ path })` pattern is appropriate. Most modules don't need this — they pull config from the global `ConfigModule`.

### Module Tests

Don't test module shells. A test that asserts `expect(module.get(MyService)).toBeDefined()` verifies that Nest's DI works, which is not your job. Test the providers inside the module instead.

The exception is integration tests that wire multiple modules and verify they boot together — those are useful for catching circular dependencies and missing providers, and belong in a `__tests__/integration/` directory if you write them.

## Testing

### Framework

Rstest (`@rstest/core`, Jest-compatible API, imports from `@rstest/core`), not Jest or Vitest. Use `@nestjs/testing` for module setup. `rstest.config.ts` sets `source.decorators.version: 'legacy'` so SWC emits `design:paramtypes` the way tsx does in prod; `src/backend/core/di-metadata.test.ts` is the canary that proves it on every run. Do not delete that file.

### What to Test (and What Not To)

**Tests are required for:**
- Repositories — every named method, against an in-memory better-sqlite3 instance with the real schema
- Services with logic — anything that orchestrates, branches, or transforms
- Custom transports — pattern dispatch, lifecycle, error propagation
- Sanitizers, cost trackers, anything with invariants the spec calls out
- Anything listed in a task's acceptance criteria

**Tests are optional for:**
- Module shells (`@Module({...})` declarations with no logic)
- DTO type definitions
- Decorator metadata
- Trivial pass-through controllers (controller test value is mostly in DTO validation, which is tested separately)
- Generated code

There is no fixed coverage percentage. The standard is: every behavior the spec or the task acceptance criteria names has a test that would fail if the behavior broke. If you're writing a test that wouldn't catch a real regression, delete it.

### Test Structure

Co-locate tests with the code they test. `staple.repository.ts` and `staple.repository.test.ts` in the same directory.

```typescript
describe('StapleRepository', () => {
  let repo: StapleRepository;
  let db: DbConnection;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(readFileSync('migrations/002_groceries.sql', 'utf-8'));
    repo = new StapleRepository(db);
  });

  afterEach(() => db.close());

  it('byName returns null when staple does not exist', async () => {
    expect(await repo.byName('cumin')).toBeNull();
  });

  it('restock updates quantity and timestamp', async () => {
    const id = await repo.insert({ name: 'cumin', quantity: 0, unit: 'oz' });
    await repo.restock(id, 4);
    const staple = await repo.byName('cumin');
    expect(staple?.quantity).toBe(4);
  });
});
```

### Mocking

Use `@nestjs/testing`'s `Test.createTestingModule()` for service tests with multiple injected dependencies. Override providers with mocks rather than constructing classes manually.

```typescript
const module = await Test.createTestingModule({
  providers: [
    GroceriesService,
    { provide: StapleRepository, useValue: createMock<StapleRepository>() },
    { provide: ReceiptRepository, useValue: createMock<ReceiptRepository>() },
    { provide: DB_CONNECTION, useValue: new Database(':memory:') },
  ],
}).compile();

const service = module.get(GroceriesService);
```

For code that touches an external system, mock the port from `domain/` (not the SDK) with a stub that returns a fixed value. Never let tests make real API calls.

### Database Tests

Use `:memory:` SQLite for repository tests. Run the actual migration SQL files to set up the schema — don't hand-write CREATE TABLE statements in tests, they'll drift from production.

### E2E Tests

Skip them unless a task specifically requires one. Frontend E2E tests use Playwright when added.

## Security (backend)

Before any commit touching Nest code, in addition to `common.md`:

- All SQL uses prepared, parameterized statements (see Patterns). Reviewers flag any `db.prepare` template literal containing `${...}`; the `no-interpolated-sql` ESLint rule catches the literal form.
- Protected routes use guards; no endpoint is accidentally open.
- Rate limiting on endpoints exposed to external callers.
- `process.env` is read only in `src/backend/core/config/`; the `no-process-env-outside-config` ESLint rule enforces this.
