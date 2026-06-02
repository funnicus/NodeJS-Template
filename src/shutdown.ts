import type { Server } from "node:http";
import { logger } from "./logger.ts";
import sdk from "./utils/tracing.ts";
import { getDb } from "./database/postgres.ts";
import timeout from "./utils/timeout.ts";

// Tracks whether the shutdown process is currently in progress.
// Prevents multiple shutdown attempts from being initiated simultaneously.
let shuttingDown = false;

/**
 * Initiates a graceful shutdown of the server, flushing logs, closing database connections, and shutting down tracing.
 *
 * @param server - The HTTP server to shut down.
 * @param exitCode - The exit code to use when shutting down. See https://nodejs.org/api/process.html#exit-codes
 */
export const shutdown = async (server: Server, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info("Shutdown signal received");

  // Graceful shutdown sequence.
  // You should flush your logs and close db connections here.
  try {
    logger.info("Shutting down HTTP server...");
    // Wait for the server to close, or timeout after 60 seconds.
    await Promise.race([
      closeServer(server),
      timeout(60_000, "Server close timeout"),
    ]);

    logger.info("Destroying db connection instance...");
    // DB might log things during shutdown
    // so better to destroy it before shutting down sdk.
    await Promise.race([
      getDb().destroy(),
      timeout(60_000, "DB destroy timeout"),
    ]);

    logger.info("Shutting down OTEL SDK...");
    await Promise.race([
      sdk.shutdown(),
      timeout(60_000, "OTEL SDK shutdown timeout"),
    ]);

    logger.info("Shutdown complete");

    logger.flush();

    // Let Node handle exit during normal shutdown.
    process.exitCode = exitCode;

    // Force exit if node hangs (for 5 seconds).
    // Notice unref() - the timer will not keep the process alive.
    setTimeout(() => {
      process.exit(exitCode);
    }, 5000).unref();
  } catch (error) {
    logger.fatal({ error }, "Error during shutdown");

    logger.flush();

    process.exitCode = 1;

    setTimeout(() => {
      process.exit(1);
    }, 5000).unref();
  }
};

/**
 * Closes the server and returns a promise that resolves when it's closed.
 */
const closeServer = (server: Server): Promise<void> => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
};
