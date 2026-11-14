/**
 * Prometheus metrics exporter for Smart Clinic OS
 */

const { pool } = require('../config/db');

class MetricsService {
  constructor() {
    this.requestsTotal = new Map(); // key: "METHOD:STATUS" -> count
    this.requestDurations = [];     // array of durations
  }

  recordRequest(method, status, durationMs) {
    const key = `${method}:${status}`;
    this.requestsTotal.set(key, (this.requestsTotal.get(key) || 0) + 1);

    if (this.requestDurations.length > 500) {
      this.requestDurations.shift();
    }
    this.requestDurations.push(durationMs);
  }

  getPrometheusMetrics() {
    const mem = process.memoryUsage();
    const uptime = process.uptime();

    let output = `# HELP smartclinic_uptime_seconds Process uptime in seconds\n`;
    output += `# TYPE smartclinic_uptime_seconds gauge\n`;
    output += `smartclinic_uptime_seconds ${uptime.toFixed(2)}\n\n`;

    output += `# HELP smartclinic_memory_heap_used_bytes Heap memory used\n`;
    output += `# TYPE smartclinic_memory_heap_used_bytes gauge\n`;
    output += `smartclinic_memory_heap_used_bytes ${mem.heapUsed}\n\n`;

    output += `# HELP smartclinic_memory_rss_bytes Resident Set Size\n`;
    output += `# TYPE smartclinic_memory_rss_bytes gauge\n`;
    output += `smartclinic_memory_rss_bytes ${mem.rss}\n\n`;

    output += `# HELP smartclinic_db_pool_total Total database pool clients\n`;
    output += `# TYPE smartclinic_db_pool_total gauge\n`;
    output += `smartclinic_db_pool_total ${pool.totalCount || 0}\n\n`;

    output += `# HELP smartclinic_db_pool_idle Idle database pool clients\n`;
    output += `# TYPE smartclinic_db_pool_idle gauge\n`;
    output += `smartclinic_db_pool_idle ${pool.idleCount || 0}\n\n`;

    output += `# HELP smartclinic_db_pool_waiting Clients waiting for connection\n`;
    output += `# TYPE smartclinic_db_pool_waiting gauge\n`;
    output += `smartclinic_db_pool_waiting ${pool.waitingCount || 0}\n\n`;

    output += `# HELP smartclinic_http_requests_total Total HTTP requests handled\n`;
    output += `# TYPE smartclinic_http_requests_total counter\n`;
    for (const [key, count] of this.requestsTotal.entries()) {
      const [method, status] = key.split(':');
      output += `smartclinic_http_requests_total{method="${method}",status="${status}"} ${count}\n`;
    }

    if (this.requestDurations.length > 0) {
      const avg = (this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length).toFixed(2);
      output += `\n# HELP smartclinic_http_average_latency_ms Rolling average latency\n`;
      output += `# TYPE smartclinic_http_average_latency_ms gauge\n`;
      output += `smartclinic_http_average_latency_ms ${avg}\n`;
    }

    return output;
  }
}

const metricsService = new MetricsService();
module.exports = metricsService;

