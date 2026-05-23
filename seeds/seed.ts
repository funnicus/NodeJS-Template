import { sql, type Kysely } from "kysely";

const EVENT_NAMES = [
  "Jake's secret party",
  "Bowling night",
  "Future Friday",
  "Team retrospective",
  "Summer picnic",
  "Board game evening",
  "Hackathon kickoff",
  "Office warming",
];

const PEOPLE = [
  "John",
  "Julia",
  "Paul",
  "Dick",
  "Anna",
  "Maria",
  "Tommi",
  "Lauri",
];

/** Returns a random date between today and 60 days from now as `YYYY-MM-DD`. */
function randomFutureDate(): string {
  const start = Date.now();
  const offset = Math.floor(Math.random() * 60) * 86_400_000;
  return new Date(start + offset).toISOString().slice(0, 10);
}

/** Pick `count` unique random items from `array`. */
function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function seed(db: Kysely<any>): Promise<void> {
  console.log("🗑️  Truncating all tables…");
  await sql`TRUNCATE TABLE vote, event_dates, event RESTART IDENTITY CASCADE`.execute(
    db,
  );
  console.log("  ✅ Tables truncated.");

  console.log("🌱 Seeding database…");

  // Create 4 events
  const eventNames = pickRandom(EVENT_NAMES, 4);

  for (const name of eventNames) {
    // Insert the event
    const event = await db
      .insertInto("event")
      .values({ name })
      .returning("id")
      .executeTakeFirstOrThrow();

    const eventId = event.id;

    // Assign 2-4 candidate dates per event
    const dateCount = 2 + Math.floor(Math.random() * 3);
    const dates = Array.from({ length: dateCount }, () => randomFutureDate());
    const uniqueDates = [...new Set(dates)];

    await db
      .insertInto("event_dates")
      .values(uniqueDates.map((date) => ({ event_id: eventId, date })))
      .execute();

    // Add 2-4 votes from random people on random dates
    const voters = pickRandom(PEOPLE, 2 + Math.floor(Math.random() * 3));

    for (const person of voters) {
      // Each voter votes on 1 to all of the available dates
      const voteDateCount = 1 + Math.floor(Math.random() * uniqueDates.length);
      const voteDates = pickRandom(uniqueDates, voteDateCount);

      await db
        .insertInto("vote")
        .values(
          voteDates.map((date) => ({
            date,
            person,
            event_id: eventId,
          })),
        )
        .execute();
    }

    console.log(
      `  ✅ "${name}" — ${uniqueDates.length} dates, ${voters.length} voters`,
    );
  }

  console.log("🌱 Seeding complete!");
}
