/**
 * Structured JSON logger backed by pino.
 * Every log line is a JSON object — ideal for ingestion by Loki / Grafana.
 *
 * The pinoHttp middleware (exported below) enriches every request log with
 * trace_id and span_id pulled from the active OpenTelemetry context so that
 * logs and traces can be correlated in Grafana.
 */

import pino from "pino";
import { pinoHttp, type Options } from "pino-http";
import { type IncomingMessage, type ServerResponse } from "http";
import { trace, context } from "@opentelemetry/api";
import config from "./config.ts";

// ---------------------------------------------------------------------------
// Base logger
// ---------------------------------------------------------------------------

export const logger = pino({
  level: config.log.level ?? "info",
  // Always emit JSON — Loki can parse this directly.
  ...(process.env["NODE_ENV"] === "development" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings(bindings) {
      return {
        pid: bindings["pid"] as string,
        host: bindings["hostname"] as string,
        service: config.app.name,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// ---------------------------------------------------------------------------
// Helpers to extract the current OTel trace/span IDs
// ---------------------------------------------------------------------------

function getTraceContext(): { trace_id: string; span_id: string } {
  const span = trace.getSpan(context.active());
  if (!span) return { trace_id: "", span_id: "" };
  const ctx = span.spanContext();
  return { trace_id: ctx.traceId, span_id: ctx.spanId };
}

// ---------------------------------------------------------------------------
// pino-http middleware
// ---------------------------------------------------------------------------

const httpLoggerOptions: Options<IncomingMessage, ServerResponse> = {
  logger,
  // Attach trace/span IDs to every request log
  customProps(_req: IncomingMessage, _res: ServerResponse) {
    return getTraceContext();
  },
  // Customise the fields written when a request completes
  customSuccessMessage(req: IncomingMessage, res: ServerResponse) {
    return `${req.method} ${req.url} ${(res as ServerResponse & { statusCode: number }).statusCode}`;
  },
  customErrorMessage(req: IncomingMessage, res: ServerResponse, err: Error) {
    return `${req.method} ${req.url} ${(res as ServerResponse & { statusCode: number }).statusCode} — ${err.message}`;
  },
  // Map HTTP status codes to log levels
  customLogLevel(_req: IncomingMessage, res: ServerResponse, err?: Error) {
    if (
      err ||
      (res as ServerResponse & { statusCode: number }).statusCode >= 500
    )
      return "error";
    if ((res as ServerResponse & { statusCode: number }).statusCode >= 400)
      return "warn";
    return "info";
  },
  // Serialise request / response fields
  serializers: {
    req(
      req: IncomingMessage & { remoteAddress?: string; remotePort?: number },
    ) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
    res(res: ServerResponse) {
      return { statusCode: res.statusCode };
    },
  },
  // Add duration_ms to the completed-request log
  customAttributeKeys: {
    responseTime: "duration_ms",
  },
  // Disable auto-logging to not flood the logs with completed-request logs
  autoLogging: false,
};

export const httpLogger = pinoHttp(httpLoggerOptions);

// ---------------------------------------------------------------------------
// Convenience: log an error with full details + trace context
// ---------------------------------------------------------------------------

export function logError(
  msg: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  const traceCtx = getTraceContext();
  if (err instanceof Error) {
    logger.error(
      {
        ...traceCtx,
        err: { message: err.message, stack: err.stack, name: err.name },
        ...extra,
      },
      msg,
    );
  } else {
    logger.error({ ...traceCtx, err, ...extra }, msg);
  }
}
