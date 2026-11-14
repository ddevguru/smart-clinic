# Smart Clinic OS — Monitoring, Metrics & Alerting Runbook

**Document ID:** `SCOS-P11-MON-009`  
**Observability Engine:** Prometheus Metrics Exporter + Health Check Service  
**Metrics Endpoint:** `GET /metrics`  
**Health Check Endpoint:** `GET /api/v1/health`

---

## 1. Metrics Architecture

Smart Clinic OS features an integrated telemetry engine (`server/src/services/metricsService.js`) exporting Prometheus-compatible metrics:

```
[ Prometheus Scraper ] ─── GET /metrics (every 15s) ───► [ Node.js Express API ]
          │                                                       │
          ▼                                                       ├── Total HTTP Requests
[ Grafana Dashboard ]                                             ├── HTTP Response Latencies
          │                                                       ├── Active DB Connections
          ▼                                                       ├── Socket.IO Connections
[ Alertmanager ] ───► PagerDuty / Slack / WhatsApp                └── System Memory & Uptime
```

---

## 2. Exported Metric Catalog

| Metric Identifier | Type | Labels | Description |
| :--- | :--- | :--- | :--- |
| `scos_http_requests_total` | Counter | `method`, `path`, `status` | Total incoming HTTP requests processed |
| `scos_http_request_duration_seconds` | Summary | `method`, `path` | Request latency percentiles (P50, P90, P95, P99) |
| `scos_db_pool_total_connections` | Gauge | — | Total connections in PostgreSQL client pool |
| `scos_db_pool_idle_connections` | Gauge | — | Idle connections available in pool |
| `scos_db_pool_waiting_clients` | Gauge | — | Queued client connection requests |
| `scos_active_socket_connections` | Gauge | — | Live real-time WebSocket clients connected |
| `scos_process_uptime_seconds` | Gauge | — | Continuous uptime of the Node.js API process |
| `scos_process_memory_bytes` | Gauge | `type` (`rss`, `heapTotal`, `heapUsed`) | V8 engine memory consumption |

---

## 3. Production Alerting Rules

```yaml
groups:
  - name: smart_clinic_os_alerts
    rules:
      - alert: DatabaseConnectionPoolStarvation
        expr: scos_db_pool_waiting_clients > 5
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL pool saturated: clients waiting for connection"

      - alert: HighHttpErrorRate
        expr: rate(scos_http_requests_total{status=~"5.."}[2m]) / rate(scos_http_requests_total[2m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API 5xx error rate exceeded 5% over 2 minutes"

      - alert: ElevatedApiLatency
        expr: scos_http_request_duration_seconds{quantile="0.95"} > 1.5
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "P95 API latency is above 1.5 seconds"

      - alert: NodeMemoryThresholdExceeded
        expr: scos_process_memory_bytes{type="heapUsed"} > 800000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Node.js Heap memory consumption exceeded 800 MB"
```

