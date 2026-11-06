import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Global, Inject, Logger, Module } from '@nestjs/common';
import Database from 'better-sqlite3';
import { APP_CONFIG } from '../config/app.config.js';
import type { AppConfig } from '../config/config.schema.js';
import { DB_CONNECTION, type DbConnection } from './db-connection.js';
import { MigrationRunner } from './migration-runner.js';

const MIGRATIONS_DIR = resolve('migrations');

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): DbConnection => {
        mkdirSync(dirname(config.databasePath), { recursive: true });
        const db = new Database(config.databasePath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        const ran = new MigrationRunner(db, MIGRATIONS_DIR).run();
        new Logger(DatabaseModule.name).log({ ran }, 'migrations applied');
        return db;
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  onApplicationShutdown(): void {
    this.db.close();
  }
}
