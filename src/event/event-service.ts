/**
 * The database calls could be extracted into their own functions and a file
 * but I don't see the need to add an extra layer of abstraction to these
 * simple functions here. Unless we want to unit test every function by mocking.
 */

import { getDb } from "../database/postgres.ts";
import type {
  CreateEvent,
  CreateVote,
  EventListItem,
  CreateEventResponse,
  ShowEventResponse,
  EventResultsResponse,
} from "./event-schema.ts";
import { formatDate, getSuitableDates, getVotesPerDate } from "./event-util.ts";

const listEvents = async (
  take: number = 50,
  skip?: number,
): Promise<EventListItem[]> => {
  const selection = getDb().selectFrom("event").selectAll().limit(take);

  if (skip) selection.offset(skip);

  return await selection.execute();
};

const getEventById = async (
  id: number,
): Promise<ShowEventResponse | undefined> => {
  const event = await getDb()
    .selectFrom("event")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!event) return;

  const datesSelection = await getDb()
    .selectFrom("event_dates")
    .selectAll()
    .where("event_id", "=", id)
    .execute();

  const voteSelection = await getDb()
    .selectFrom("vote")
    .selectAll()
    .where("event_id", "=", id)
    .execute();

  const votes = getVotesPerDate(voteSelection);

  const result = {
    id,
    name: event.name,
    dates: datesSelection.map((row) => formatDate(row.date)),
    votes,
  };

  return result;
};

const createEvent = async (
  newEvent: CreateEvent,
): Promise<CreateEventResponse> => {
  const id = await getDb()
    .transaction()
    .execute(async (trx) => {
      const insertedEvent = await trx
        .insertInto("event")
        .values({ name: newEvent.name })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("event_dates")
        .values(
          newEvent.dates.map((date) => ({ event_id: insertedEvent.id, date })),
        )
        .returningAll()
        .execute();

      return insertedEvent.id;
    });

  return { id };
};

const voteEvent = async (id: number, newVotes: CreateVote) => {
  const selection = await getDb()
    .insertInto("vote")
    .values(
      newVotes.votes.map((date) => ({
        event_id: id,
        person: newVotes.name,
        date,
      })),
    )
    .returningAll()
    .execute();

  return selection;
};

const getEventResults = async (
  id: number,
): Promise<EventResultsResponse | undefined> => {
  const event = await getDb()
    .selectFrom("event")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!event) return;

  const voteSelection = await getDb()
    .selectFrom("vote")
    .selectAll()
    .where("event_id", "=", id)
    .execute();

  const suitableDates = getSuitableDates(voteSelection);

  const result = {
    id,
    name: event.name,
    suitableDates,
  };

  return result;
};

export { listEvents, getEventById, createEvent, voteEvent, getEventResults };
