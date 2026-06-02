/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Kysely, PostgresDialect } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import { Pool } from "pg";
import { promises as fs } from "node:fs";
import path from "node:path";
import request from "supertest";
import createApp from "../app.ts";
import { setDb } from "../database/postgres.ts";
import type { Database } from "../database/types.ts";

let container: StartedPostgreSqlContainer;
let db: Kysely<Database>;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18").start();

  db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: container.getHost(),
        port: container.getMappedPort(5432),
        database: container.getDatabase(),
        user: container.getUsername(),
        password: container.getPassword(),
      }),
    }),
  });

  // Run migrations
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve(import.meta.dirname, "../../migrations"),
    }),
  });

  const { error } = await migrator.migrateToLatest();
  if (error) throw new Error("Migration failed", { cause: error });

  // Inject the test database into the application
  setDb(db);

  app = createApp();
});

afterAll(async () => {
  await db?.destroy();
  await container?.stop();
});

beforeEach(async () => {
  // Clean tables between tests (order matters due to foreign keys)
  await db.deleteFrom("vote").execute();
  await db.deleteFrom("event_dates").execute();
  await db.deleteFrom("event").execute();
});

const API = "/api/v1/event";

/** Helper to create an event and return its id. */
const createTestEvent = async (
  name: string,
  dates: string[],
): Promise<number> => {
  const res = await request(app).post(API).send({ name, dates });
  return res.body.id;
};

describe("POST /api/v1/event", () => {
  it("creates an event and returns 201 with the id", async () => {
    const res = await request(app)
      .post(API)
      .send({ name: "Christmas Party", dates: ["2024-12-24", "2024-12-25"] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(Object.keys(res.body)).toEqual(["id"]);
  });

  it("returns 400 for invalid payload", async () => {
    const res = await request(app).post(API).send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /api/v1/event/list", () => {
  it("returns an empty list when no events exist", async () => {
    const res = await request(app).get(`${API}/list`);

    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
  });

  it("returns created events", async () => {
    await createTestEvent("Event A", ["2024-01-01"]);
    await createTestEvent("Event B", ["2024-02-01"]);

    const res = await request(app).get(`${API}/list`);

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(2);
  });
});

describe("GET /api/v1/event/:id", () => {
  it("returns a specific event with its dates and votes", async () => {
    const eventId = await createTestEvent("Jake's party", [
      "2024-01-01",
      "2024-01-05",
    ]);

    const res = await request(app).get(`${API}/${eventId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventId);
    expect(res.body.name).toBe("Jake's party");
    expect(res.body.dates).toEqual(["2024-01-01", "2024-01-05"]);
    expect(res.body.votes).toEqual([]);
  });

  it("returns 404 for a non-existent event", async () => {
    const res = await request(app).get(`${API}/99999`);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/v1/event/:id/vote", () => {
  it("adds votes and returns the updated event", async () => {
    const eventId = await createTestEvent("Team Lunch", [
      "2024-06-01",
      "2024-06-02",
    ]);

    const res = await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Alice", votes: ["2024-06-01"] });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventId);
    expect(res.body.dates).toEqual(["2024-06-01", "2024-06-02"]);
    expect(res.body.votes).toHaveLength(1);
    expect(res.body.votes[0].date).toBe("2024-06-01");
    expect(res.body.votes[0].people).toContain("Alice");
  });

  it("aggregates multiple votes on the same date", async () => {
    const eventId = await createTestEvent("Sprint Review", ["2024-06-01"]);

    await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Alice", votes: ["2024-06-01"] });

    const res = await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Bob", votes: ["2024-06-01"] });

    expect(res.status).toBe(200);
    expect(res.body.votes).toHaveLength(1);
    expect(res.body.votes[0].people).toEqual(["Alice", "Bob"]);
  });

  it("handles a person voting for multiple dates at once", async () => {
    const eventId = await createTestEvent("Offsite", [
      "2024-06-01",
      "2024-06-02",
    ]);

    const res = await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Alice", votes: ["2024-06-01", "2024-06-02"] });

    expect(res.status).toBe(200);
    expect(res.body.votes).toHaveLength(2);
  });

  it("returns 422 when voting on a non-existent event", async () => {
    const res = await request(app)
      .post(`${API}/99999/vote`)
      .send({ name: "Alice", votes: ["2024-06-01"] });

    expect(res.status).toBe(422);
  });
});

describe("GET /api/v1/event/:id/results", () => {
  it("returns suitable dates where all participants can attend", async () => {
    const eventId = await createTestEvent("Offsite", [
      "2024-06-01",
      "2024-06-02",
    ]);

    // Both Alice and Bob vote for June 1
    await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Alice", votes: ["2024-06-01", "2024-06-02"] });
    await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Bob", votes: ["2024-06-01"] });

    const res = await request(app).get(`${API}/${eventId}/results`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventId);
    expect(res.body.name).toBe("Offsite");
    // Only June 1 is suitable (both Alice and Bob voted for it)
    expect(res.body.suitableDates).toHaveLength(1);
    expect(res.body.suitableDates[0].date).toBe("2024-06-01");
    expect(res.body.suitableDates[0].people).toEqual(["Alice", "Bob"]);
  });

  it("returns empty suitable dates when no common date exists", async () => {
    const eventId = await createTestEvent("Dinner", [
      "2024-06-01",
      "2024-06-02",
    ]);

    await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Alice", votes: ["2024-06-01"] });
    await request(app)
      .post(`${API}/${eventId}/vote`)
      .send({ name: "Bob", votes: ["2024-06-02"] });

    const res = await request(app).get(`${API}/${eventId}/results`);

    expect(res.status).toBe(200);
    expect(res.body.suitableDates).toEqual([]);
  });

  it("returns 404 for a non-existent event", async () => {
    const res = await request(app).get(`${API}/99999/results`);

    expect(res.status).toBe(404);
  });
});
