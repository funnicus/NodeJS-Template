import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("vote")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("date", "date", (col) => col.notNull())
    .addColumn("person", "varchar(255)", (col) => col.notNull())
    .addColumn("event_id", "integer", (col) =>
      col.notNull().references("event.id").onDelete("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("vote").execute();
}
