/**
 * Structured JSON logger backed by pino.
 * Every log line is a JSON object — ideal for ingestion by Loki / Grafana.
 */

import pino from "pino";
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
