import { z } from "zod";

export const eventCreationSchema = z.object({
  name: z.string(),
  dates: z.array(z.string()),
});

export const voteCreationSchema = z.object({
  name: z.string(),
  votes: z.array(z.string()),
});

export type CreateEvent = z.infer<typeof eventCreationSchema>;
export type CreateVote = z.infer<typeof voteCreationSchema>;

// Response body types

export interface ErrorResponse {
  message: string;
}

export interface Vote {
  date: string;
  people: string[];
}

export interface EventListItem {
  id: number;
  name: string;
}

export interface EventListResponse {
  events: EventListItem[];
}

export interface CreateEventResponse {
  id: number;
}

export interface ShowEventResponse {
  id: number;
  name: string;
  dates: string[];
  votes: Vote[];
}

export interface VoteResponse {
  id: number;
  name: string;
  dates: string[];
  votes: Vote[];
}

export interface EventResultsResponse {
  id: number;
  name: string;
  suitableDates: Vote[];
}
