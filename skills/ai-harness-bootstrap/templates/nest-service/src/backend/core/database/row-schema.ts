import type { z } from 'zod';

/**
 * Parses a row a statement's `get()` returned, or passes `undefined` (no row) through.
 * Repositories parse every row they read so a column the schema and the table disagree on
 * fails loudly instead of arriving as `undefined`.
 */
export function parseOptionalRow<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> | undefined {
  return raw === undefined ? undefined : schema.parse(raw);
}

/** Parses the rows a statement's `all()` returned. */
export function parseRows<S extends z.ZodType>(schema: S, raw: unknown): z.output<S>[] {
  if (!Array.isArray(raw)) throw new TypeError('Expected an array of rows');
  return raw.map((row: unknown) => schema.parse(row));
}
