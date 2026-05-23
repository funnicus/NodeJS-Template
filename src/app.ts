import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import newEventRouter from "./event/event-handlers.ts";
import { errorHandler } from "./middleware.ts";

/**
 * Creates the Express app with all the necessary middleware and routes.
 * You can use this during integration tests or real app code.
 */
const createApp = (): Express => {
  const app = express();
  const prefix = "/api/v1";

  // Use helmet to set useful security headers.
  app.use(helmet());
  // Setup cors here if you need it in the future.
  app.use(cors());
  app.use(express.json());

  app.use(`${prefix}/event`, newEventRouter());

  // Centralized error handling after routes.
  // This will catch any errors thrown by route handlers.
  // Except inside async callbacks.
  app.use(errorHandler);

  return app;
};

export default createApp;
