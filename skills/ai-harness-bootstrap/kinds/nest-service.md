# nest-service

A NestJS service with no UI tree: a worker, an API consumed by something else, a bot. better-sqlite3 behind named-method repositories; swap the `DB_CONNECTION` provider for Postgres when needed, the repository shape stays.

## Layout

```
src/backend/
  main.ts                     bootstrap; the only file that may import nestjs-pino's Logger
  app.module.ts               composition root; the only importer of transport/ and the BFF tree
  core/
    config/                   APP_CONFIG token, Zod schema, the only process.env reader
    database/                 DB_CONNECTION provider, MigrationRunner, row-schema.ts (parseRows, parseOptionalRow)
    logging/                  nestjs-pino LoggerModule
    types/                    pure types that domain/ may import
    di-metadata.test.ts       canary: the test compiler emits decorator metadata
  transport/                  inbound adapters (bot framework, queue consumer); dispatch into api/ only
  <module>/                   one bounded context, five layers
    <module>.module.ts
    api/  use-case/  application/  data-access/  domain/
migrations/                   NNN_name.sql, append-only; tests seed from these
  schema-contract.test.ts     every table against its registered Zod row schema
```

## Scripts

`dev` (tsx watch), `build`, `typecheck`, `start`, `test`, `format`, `format:check`, `lint`, `depcruise`, `depcruise:graph`, `check`.

## Guards

Everything in `anti-drift.md` marked nest-service: boundaries, depcruise layer and tree rules, the six custom rules, vendor SDK fences, pino fence, decorator metadata in Rstest with the `di-metadata` canary, Zod config, append-only migrations, the schema contract test, Prettier.

## Rules copied

`common.md`, `backend.md` (paths `src/backend/**/*.ts`, `src/backend-for-frontend/**/*.ts`).

## First feature checklist

- Each external system gets one gateway in `<module>/data-access/<system>.gateway.ts` and one entry in `VENDOR_SDK_FENCES` + `GATEWAY_FILES` the same day the SDK is added.
- A new table starts with a schema review block on the issue or PR, then a new migration file, the Zod row schema with its entry in `migrations/schema-contract.test.ts`, the repository with prepared statements in the constructor (rows parsed, never cast), then the test against `:memory:`.
- A new env var is a line in `config.schema.ts`, a line in `config.module.ts`, a line in `.env.example`.
- A transport is wired in `main.ts` or `app.module.ts` only.
- First ADR when the first real decision lands (why this storage, why this transport). Copy `docs/decisions/ADR-0000-template.md`.
