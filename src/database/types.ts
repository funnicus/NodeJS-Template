import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface Database {
  event: EventTable;
  event_dates: EventDates;
  vote: VoteTable;
}

export interface EventTable {
  id: Generated<number>;
  name: string;
}

export type Event = Selectable<EventTable>;
export type NewEvent = Insertable<EventTable>;
export type EventUpdate = Updateable<EventTable>;

export interface EventDates {
  event_id: number;
  date: ColumnType<Date, string | undefined, never>;
}

export type EventDate = Selectable<EventDates>;
export type NewEventDate = Insertable<EventDates>;

export interface VoteTable {
  id: Generated<number>;
  date: ColumnType<Date, string | undefined, never>;
  person: string;

  event_id: number;
}

export type Vote = Selectable<VoteTable>;
export type NewVote = Insertable<VoteTable>;
export type VoteUpdate = Updateable<VoteTable>;
