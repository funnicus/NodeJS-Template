import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import newEventRouter from "./event/event-handlers.ts";
import newHealthRouter from "./health/health-handlers.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { rateLimiter } from "./middleware/rate-limiter.ts";
import { wideEventHandler } from "./middleware/wide-event.ts";
import { traceHandler } from "./middleware/trace-handler.ts";
import { metricsCollectorHandler } from "./middleware/metrics-handler.ts";
import { metricsHandler } from "./metrics.ts";

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
  // Limit the size of incoming JSON and URL-encoded bodies to 10mb.
  // Defaults are a bit smaller (100kb), which is fine too.
  // This is purely an example.
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  // Apply rate limiting to all incoming requests.
  app.use(rateLimiter);
  // Centralized logging based on wide events philosophy.
  // Must be registered before routes so req.event is initialized for every request.
  app.use(wideEventHandler);
  // Add tracing to all incoming requests.
  app.use(traceHandler);
  app.use(metricsCollectorHandler);

  app.get(`${prefix}/metrics`, metricsHandler);
  app.use(`${prefix}/health`, newHealthRouter());
  app.use(`${prefix}/event`, newEventRouter());
  // Centralized error handling after routes.
  // This will catch any errors thrown by route handlers.
  // Except inside async callbacks.
  app.use(errorHandler);

  return app;
};

export default createApp;
