import config from "./config.ts";
import "./utils/tracing.ts";
import { logger } from "./logger.ts";
import createApp from "./app.ts";
import { shutdown } from "./shutdown.ts";
import { getIPv4Addresses } from "./utils/network.ts";
import { SHUTDOWN_SIGNALS } from "./utils/constants.ts";

const app = createApp();

const server = app.listen(config.app.port, () => {
  for (const ipv4 of getIPv4Addresses()) {
    logger.info(`Server listening at: http://${ipv4}:${config.app.port}`);
  }
});

SHUTDOWN_SIGNALS.forEach((evt) => process.on(evt, () => void shutdown(server)));

process.on("uncaughtException", (error) => {
  logger.error({ error }, "Uncaught exception");
  void shutdown(server, 1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
  void shutdown(server, 1);
});
