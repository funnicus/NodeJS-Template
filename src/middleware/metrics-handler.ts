import type { RequestHandler } from "express";
import {
  activeRequests,
  httpRequestDurationSeconds,
  httpRequestsTotal,
} from "../metrics.ts";
import type { ExpressRoute } from "../types.ts";

export const metricsCollectorHandler: RequestHandler = (req, res, next) => {
  if (req.path === "/metrics") return next();

  activeRequests.inc();

  const started = process.hrtime.bigint();

  res.on("finish", () => {
    activeRequests.dec();

    // Hrtime might be more precise (nanoseconds) than performance.now()
    const durationSeconds =
      Number(process.hrtime.bigint() - started) / 1_000_000_000;

    const routeRecord = req.route as ExpressRoute;
    const route =
      typeof routeRecord?.path === "string" ? routeRecord.path : "unknown";

    httpRequestDurationSeconds.observe(
      { method: req.method, route },
      durationSeconds,
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });
  });

  next();
};
