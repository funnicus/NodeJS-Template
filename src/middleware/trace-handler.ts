import type { RequestHandler } from "express";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import config from "../config.ts";
import type { ExpressRoute } from "../types.ts";

const tracer = trace.getTracer(config.app.name);

/**
 * Middleware that sets up traces for incoming requests using OpenTelemetry.
 * Use after the wideEvent middleware.
 *
 * Set attributes you want to include in every trace here.
 *
 * To access and modify the trace context later down the chain:
 *
 * ```ts
 * import { trace } from "@opentelemetry/api";
 *
 * const span = trace.getActiveSpan();
 *
 * span?.setAttribute("event.id", id);
 * ```
 */
export const traceHandler: RequestHandler = (req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  const ctx = trace.setSpan(context.active(), span);

  const spanContext = span.spanContext();

  span.setAttribute("req.id", req.event.request_id);
  span.setAttribute("req.method", req.method);

  req.event.trace_id = spanContext.traceId;
  req.event.span_id = spanContext.spanId;

  res.on("finish", () => {
    span.setAttribute("http.status_code", res.statusCode);

    const routePath = (req.route as ExpressRoute | undefined)?.path;
    if (typeof routePath === "string") {
      span.setAttribute("http.route", routePath);
    }

    if (res.statusCode >= 500) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    span.end();
  });

  context.with(ctx, next);
};
