import type { NextFunction, Request, Response } from "express";
import type { ExpressRoute, WideEvent } from "../types.ts";
import { logger } from "../logger.ts";
import config from "../config.ts";

const SAMPLED_ERROR_LEVELS = ["error", "fatal"];

/**
 * Wide events only log a single big object at the end of each request.
 * Each wide event contains all the desired information about the request.
 * Good for keeping the request context together, reducing log noise.
 *
 * When you want to log something, you should manually add relevant context to the event object, as
 * requests travel through the middleware chain.
 *
 * ```ts
 * req.event.somethingToLog = aVariable;
 * ```
 *
 * Read more here https://loggingsucks.com/
 */
export const wideEventHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const started = performance.now();

  // Initialize the wide event with request context
  req.event = {
    event: "http_request",
    request_id: crypto.randomUUID(),
    method: req.method,
    url: req.originalUrl,
  };

  // We only log at the end of each request (wide-event philosophy).
  res.on("finish", () => {
    req.event.status_code = res.statusCode;
    req.event.duration_ms = Math.round(performance.now() - started);

    const routePath = (req.route as ExpressRoute)?.path;
    if (typeof routePath === "string") {
      req.event.route = routePath;
    }

    if (shouldSample(req.event)) {
      if (req.event.error) {
        switch (req.event.error.level) {
          case "fatal":
            logger.fatal(req.event);
            break;
          case "error":
            logger.error(req.event);
            break;
          case "warn":
            logger.warn(req.event);
            break;
          case "debug":
            logger.debug(req.event);
            break;
        }
      } else {
        logger.info(req.event);
      }
    }
  });

  next();
};

/**
 * Tail sampling decision function. Configure this
 * to achieve the level of cardinality you are looking for
 * (the more unique - higher cardinality - the log is, the better most often).
 */
const shouldSample = (event: WideEvent): boolean => {
  // Always keep 500 errors
  if (event.status_code && event.status_code >= 500) return true;

  if (SAMPLED_ERROR_LEVELS.some((level) => event.error?.level === level)) {
    return true;
  }

  if (event.duration_ms !== undefined && event.duration_ms > 2000) {
    // Always keep slow requests (above p99)
    return true;
  }

  // EXAMPLES:
  // Always keep VIP users
  //if (event["user"]?.["subscription"] === "enterprise") return true;

  // Always keep requests with specific feature flags (debugging rollouts)
  //if (event["feature_flags"]?.["new_vote_flow"]) return true;

  // Random sample the rest as defined in config (default 5%)
  return Math.random() < config.log.samplingRate;
};
