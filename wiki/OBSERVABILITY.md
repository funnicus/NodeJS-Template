# Mental model for all the data collected

Traces:
OpenTelemetry SDK → OTLP exporter → Tempo / Grafana Cloud Traces

Logs:
Pino wide events → stdout → Alloy/Promtail/Fluent Bit → Loki / Grafana Cloud Logs

Metrics:
prom-client / OTel metrics → Prometheus / Grafana Cloud Metrics
