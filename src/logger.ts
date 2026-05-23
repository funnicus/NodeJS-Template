/**
 * You can expand the logger capablities here
 * if you want so in the future.
 */

import pino from "pino";
import config from "./config.ts";

export const logger = pino({
  level: config.logLevel,
  ...(process.env["NODE_ENV"] === "development" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
  timestamp: pino.stdTimeFunctions.isoTime,
});
