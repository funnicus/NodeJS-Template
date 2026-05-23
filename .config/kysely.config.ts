import { PostgresDialect } from "kysely";
import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({
      database: process.env["DATABASE_NAME"] || "postgres",
      host: process.env["DATABASE_HOST"] || "localhost",
      user: process.env["DATABASE_USER"] || "postgres",
      password: process.env["DATABASE_PASSWORD"] || "postgres",
      port: Number(process.env["DATABASE_PORT"]) || 5432,
      max: Number(process.env["DATABASE_MAX"]) || 10,
    }),
  }),
});
