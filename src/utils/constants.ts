// PostgreSQL error codes
// https://www.postgresql.org/docs/current/errcodes-appendix.html
export const PG_ERROR_CODES = {
  NOT_NULL_VIOLATION: "23502",
  FOREIGN_KEY_VIOLATION: "23503",
  UNIQUE_VIOLATION: "23505",
  CHECK_VIOLATION: "23514",
} as const;

/** Only include signals that warrant graceful shutdown.
 * SIGSEGV, SIGILL, SIGBUS, SIGABRT are examples of signals
 * that benefit from loud a shutdown.
 */
export const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT", "SIGHUP"] as const;
