/**
 * OpenTelemetry tracing setup.
 * This file MUST be imported at the very top of index.ts before any other imports
 * so that auto-instrumentation patches are applied before libraries are loaded.
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import config from "../config.ts";

const OTLP_ENDPOINT = config.otel.otlpEndpoint;

const exporter = new OTLPTraceExporter({
  url: `${OTLP_ENDPOINT}/v1/traces`,
  headers: {},
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: config.otel.serviceName,
  [ATTR_SERVICE_VERSION]: config.npmPackageVersion,
  "deployment.environment": config.app.environment,
});

const sdk = new NodeSDK({
  resource,
  spanProcessors: [new BatchSpanProcessor(exporter)],
  instrumentations: [
    getNodeAutoInstrumentations({
      // Reduce noise from fs polling; keep HTTP, Express, pg
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-http": { enabled: true },
      "@opentelemetry/instrumentation-express": { enabled: true },
      "@opentelemetry/instrumentation-pg": { enabled: true },
    }),
  ],
});

sdk.start();

export default sdk;
