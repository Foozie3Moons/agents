import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { MigrationRunner } from './migration-runner.js';

describe('MigrationRunner', () => {
  it('applies each migration once, in order', () => {
    const db = new Database(':memory:');
    const runner = new MigrationRunner(db, resolve('migrations'));
    expect(runner.run()).toEqual(['001_init.sql']);
    expect(runner.run()).toEqual([]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM app_meta').get()).toEqual({ n: 0 });
  });
});
