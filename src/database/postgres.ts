import type { Database } from "./types.ts";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import config from "../config.ts";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  max?: number;
}

export function createDb(options?: DbConfig): Kysely<Database> {
  const dialect = new PostgresDialect({
    pool: new Pool({
      database: options?.database ?? config.database.name,
      host: options?.host ?? config.database.host,
      user: options?.user ?? config.database.user,
      password: options?.password ?? config.database.password,
      port: options?.port ?? config.database.port,
      max: options?.max ?? config.database.max,
    }),
  });

  return new Kysely<Database>({ dialect });
}

let _db: Kysely<Database> | undefined;

/** Returns the current Kysely instance, creating one with default config if needed. */
export function getDb(): Kysely<Database> {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

/** Replaces the current Kysely instance. Used by integration tests. */
export function setDb(db: Kysely<Database>): void {
  _db = db;
}
