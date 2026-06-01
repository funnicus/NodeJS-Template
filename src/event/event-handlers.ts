import type { RequestHandler, Router } from "express";
import express from "express";
import { validateData } from "../middleware.ts";
import { eventCreationSchema, voteCreationSchema } from "./event-schema.ts";
import type {
  CreateEvent,
  CreateVote,
  EventListResponse,
  CreateEventResponse,
  ShowEventResponse,
  VoteResponse,
  EventResultsResponse,
  ErrorResponse,
} from "./event-schema.ts";
import {
  listEvents,
  getEventById,
  createEvent,
  voteEvent,
  getEventResults,
} from "./event-service.ts";
import { StatusCodes } from "http-status-codes";
import { logger } from "../logger.ts";

/**
 * Builds the router for event-related endpoints.
 */
const newEventRouter = () => {
  const eventRouter: Router = express.Router();

  eventRouter.get("/list", eventListHandler);
  eventRouter.get("/:id", eventGetHandler);
  eventRouter.post("/", validateData(eventCreationSchema), eventCreateHandler);
  eventRouter.post(
    "/:id/vote",
    validateData(voteCreationSchema),
    eventCreateVotesHandler,
  );
  eventRouter.get("/:id/results", eventGetResultsHandler);

  return eventRouter;
};

/**
 * GET `/api/v1/event/list`
 */
export const eventListHandler: RequestHandler<
  Record<string, never>,
  EventListResponse | ErrorResponse
> = async (_req, res) => {
  const events = await listEvents();

  return res.status(StatusCodes.OK).json({ events });
};

/**
 * GET `/api/v1/event/{id}`
 */
export const eventGetHandler: RequestHandler<
  { id: string },
  ShowEventResponse | ErrorResponse
> = async (req, res) => {
  const { id } = req.params;

  const event = await getEventById(Number(id));

  if (!event) {
    logger.warn(`Event ${id} not found`);

    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: `Event ${id} not found` });
  }

  return res.status(StatusCodes.OK).json(event);
};

/**
 * POST `/api/v1/event`
 */
export const eventCreateHandler: RequestHandler<
  Record<string, never>,
  CreateEventResponse | ErrorResponse,
  CreateEvent
> = async (req, res) => {
  const newEvent = req.body;

  const created = await createEvent(newEvent);

  logger.info(created, "Event created");

  return res.status(StatusCodes.CREATED).json(created);
};

/**
 * POST `/api/v1/event/{id}/vote`
 */
export const eventCreateVotesHandler: RequestHandler<
  { id: string },
  VoteResponse | ErrorResponse,
  CreateVote
> = async (req, res) => {
  const { id } = req.params;

  const newVotes = await voteEvent(Number(id), req.body);
  const updatedEvent = await getEventById(Number(id));

  logger.info(newVotes, "Votes created");

  return res.status(StatusCodes.OK).json(updatedEvent);
};

/**
 * GET `/api/v1/event/{id}/results`
 */
export const eventGetResultsHandler: RequestHandler<
  { id: string },
  EventResultsResponse | ErrorResponse
> = async (req, res) => {
  const { id } = req.params;

  const results = await getEventResults(Number(id));

  if (!results) {
    logger.warn(`Event ${id} not found`);

    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: `Event ${id} not found` });
  }

  return res.status(StatusCodes.OK).json(results);
};

export default newEventRouter;
