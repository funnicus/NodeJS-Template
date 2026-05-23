import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("event_dates")
    .addColumn("event_id", "integer", (col) =>
      col.notNull().references("event.id").onDelete("cascade"),
    )
    .addColumn("date", "date", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("event_dates").execute();
}
