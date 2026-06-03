/**
 * Prometheus metrics definitions.
 *
 * All metrics are created here and exported for use in route handlers and
 * middleware.  The default prom-client registry is used so that the built-in
 * Node.js / process metrics are collected automatically.
 */

import type { RequestHandler } from "express";
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from "prom-client";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const register = new Registry();

// Collect default Node.js metrics (event loop lag, GC, memory, etc.)
collectDefaultMetrics({ register });

// ---------------------------------------------------------------------------
// HTTP metrics
// ---------------------------------------------------------------------------

/**
 * Total number of HTTP requests completed, labelled by method, route, and
 * status code.  Use the normalised route pattern (e.g. /users) not the raw
 * URL so high-cardinality IDs don't explode the metric.
 */
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

/**
 * Histogram of HTTP request durations in seconds.
 * Buckets cover the range expected for this demo app (1 ms → 5 s).
 */
export const httpRequestDurationSeconds = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

/**
 * Number of HTTP requests currently being processed (in-flight gauge).
 */
export const activeRequests = new Gauge({
  name: "active_requests",
  help: "Number of HTTP requests currently being processed",
  registers: [register],
});

// ---------------------------------------------------------------------------
// Business metrics
// ---------------------------------------------------------------------------

// EXAMPLE: Custom business metric: total checkout attempts, labelled by outcome.
// Labels: status = "success" | "failure"
// export const checkoutsTotal = new Counter({
//   name: "checkouts_total",
//   help: "Total number of checkout attempts",
//   labelNames: ["status"] as const,
//   registers: [register],
// });

// ---------------------------------------------------------------------------
// Handler for metrics
// ---------------------------------------------------------------------------

/**
 * Prometheus can collect metrics from this endpoint.
 */
export const metricsHandler: RequestHandler = async (_req, res) => {
  res.set("Content-Type", register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
};
