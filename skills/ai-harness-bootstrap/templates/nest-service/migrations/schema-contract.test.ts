import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import Database from 'better-sqlite3';
import type { z } from 'zod';
import { AppMetaRow } from '../src/backend/core/database/app-meta.row.js';
import { MigrationRunner } from '../src/backend/core/database/migration-runner.js';

const MIGRATIONS_DIR = import.meta.dirname;

/** Tables that hold no rows the app reads through a repository: the migration ledger. */
const EXEMPT = new Set(['schema_migrations']);

interface ColumnInfo {
  readonly name: string;
  readonly notnull: number;
  readonly pk: number;
}

type AnyObject = z.ZodObject<z.ZodRawShape>;

/**
 * `row`: the canonical full-row schema for a table; its keys must equal the table's columns.
 * `projection`: a partial read model (a BFF view, a join); its keys must be a subset of the
 * table's columns, apart from `computed` keys the query derives (a joined name, a length).
 */
interface RowSchemaEntry {
  readonly kind: 'row' | 'projection';
  readonly table: string;
  readonly name: string;
  readonly schema: AnyObject;
  readonly computed: readonly string[];
}

const row = (table: string, name: string, schema: AnyObject): RowSchemaEntry => ({
  kind: 'row',
  table,
  name,
  schema,
  computed: [],
});
// Used once the first partial read model exists:
//   projection('orders', 'OrderSummaryRow', OrderSummaryRow, ['customer_name'])
export const projection = (
  table: string,
  name: string,
  schema: AnyObject,
  computed: readonly string[] = [],
): RowSchemaEntry => ({ kind: 'projection', table, name, schema, computed });

/** Every table the app reads, and the schema each repository parses its rows with. */
const ROW_SCHEMAS: readonly RowSchemaEntry[] = [row('app_meta', 'AppMetaRow', AppMetaRow)];

function shapeKeys(schema: AnyObject): string[] {
  return Object.keys(schema.shape).sort();
}

/** True when the schema's field accepts null, i.e. a nullable column can be read through it. */
function acceptsNull(schema: AnyObject, key: string): boolean {
  const field = schema.shape[key] as z.ZodType | undefined;
  return field?.safeParse(null).success ?? false;
}

describe('schema contract: every table matches its registered Zod row schema', () => {
  const db = new Database(':memory:');
  let tables: string[] = [];
  const columnsOf = (table: string): ColumnInfo[] =>
    db.prepare('SELECT name, "notnull", pk FROM pragma_table_info(?)').all(table) as ColumnInfo[];

  beforeAll(() => {
    new MigrationRunner(db, MIGRATIONS_DIR).run();
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[];
    tables = rows.map((r) => r.name).filter((name) => !EXEMPT.has(name));
  });

  afterAll(() => {
    db.close();
  });

  it('registers a canonical row schema for every table', () => {
    const canonical = new Set(ROW_SCHEMAS.filter((e) => e.kind === 'row').map((e) => e.table));
    expect(tables.filter((t) => !canonical.has(t))).toEqual([]);
  });

  it('registers each table at most once as canonical', () => {
    const seen = ROW_SCHEMAS.filter((e) => e.kind === 'row').map((e) => e.table);
    expect(seen.filter((t, i) => seen.indexOf(t) !== i)).toEqual([]);
  });

  it.each(ROW_SCHEMAS.map((e): [string, RowSchemaEntry] => [`${e.kind} ${e.name}`, e]))(
    '%s matches its table',
    (_label, entry) => {
      const columns = columnsOf(entry.table);
      expect(columns, `table ${entry.table} does not exist`).not.toEqual([]);
      const columnNames = columns.map((c) => c.name).sort();
      const keys = shapeKeys(entry.schema).filter((k) => !entry.computed.includes(k));

      expect(
        keys.filter((k) => !columnNames.includes(k)),
        'schema keys with no column',
      ).toEqual([]);
      if (entry.kind === 'row') {
        expect(
          columnNames.filter((c) => !keys.includes(c)),
          'columns missing from the schema',
        ).toEqual([]);
      }

      const nullableColumns = columns.filter((c) => c.notnull === 0 && c.pk === 0).map((c) => c.name);
      const rejectsNull = nullableColumns.filter((c) => keys.includes(c) && !acceptsNull(entry.schema, c));
      expect(rejectsNull, 'nullable columns whose schema rejects null').toEqual([]);
    },
  );
});
