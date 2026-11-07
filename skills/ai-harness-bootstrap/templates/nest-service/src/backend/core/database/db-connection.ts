import type Database from 'better-sqlite3';

export const DB_CONNECTION = Symbol('DB_CONNECTION');
export type DbConnection = Database.Database;
