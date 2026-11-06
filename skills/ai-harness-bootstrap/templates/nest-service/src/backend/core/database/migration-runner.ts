import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DbConnection } from './db-connection.js';

// Applies migrations/NNN_name.sql in order, once each. Append-only: never edit
// an applied file; write the next number. Tests seed :memory: databases from
// the same files so schema cannot drift between prod and tests.
export class MigrationRunner {
  constructor(
    private readonly db: DbConnection,
    private readonly dir: string,
  ) {}

  run(): string[] {
    this.db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
    const applied = new Set(
      this.db.prepare('SELECT name FROM schema_migrations').all().map((r) => (r as { name: string }).name),
    );
    const files = readdirSync(this.dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
    const record = this.db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)');
    const ran: string[] = [];
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(this.dir, file), 'utf8');
      this.db.transaction(() => {
        this.db.exec(sql);
        record.run(file, Date.now());
      })();
      ran.push(file);
    }
    return ran;
  }
}
