const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { port, storageDir } = require('./config/env');
const { initializeDatabaseIfNeeded } = require('./config/initDb');

// Import routes
const authRoutes = require('./routes/auth.routes');
const clinicRoutes = require('./routes/clinic.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const queueRoutes = require('./routes/queue.routes');
const billingRoutes = require('./routes/billing.routes');
const ehrRoutes = require('./routes/ehr.routes');
const adminRoutes = require('./routes/admin.routes');
const discoveryRoutes = require('./routes/discovery.routes');
const patientPortalRoutes = require('./routes/patientPortal.routes');
const automationRoutes = require('./routes/automation.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const webhookRoutes = require('./routes/webhook.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const aiRoutes = require('./routes/ai.routes');
const teleconsultationRoutes = require('./routes/teleconsultation.routes');
const abdmRoutes = require('./routes/abdm.routes');
const labIntegrationRoutes = require('./routes/labIntegration.routes');
const pharmacyIntegrationRoutes = require('./routes/pharmacyIntegration.routes');
const clinicIntelligenceRoutes = require('./routes/clinicIntelligence.routes');
const recordSharingRoutes = require('./routes/recordSharing.routes');
const integrationAdminRoutes = require('./routes/integrationAdmin.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Attach Socket.IO to app
app.set('io', io);

io.on('connection', (socket) => {
  // Join clinic room for live queue updates
  socket.on('join:clinic', (clinicId) => {
    if (clinicId) socket.join(`clinic:${clinicId}`);
  });

  socket.on('join:doctor', (doctorId) => {
    if (doctorId) socket.join(`doctor:${doctorId}`);
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const metricsService = require('./services/metricsService');
const { pool } = require('./config/db');
const crypto = require('crypto');

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));

// Production Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Distributed request tracing
  const reqId = req.headers['x-request-id'] || `req-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);

  // Measure latency for metrics
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsService.recordRequest(req.method, res.statusCode, duration);
  });

  next();
});

// General API Rate Limiting
app.use('/api/', apiLimiter);

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for storage (PDFs, receipts)
app.use('/storage', express.static(storageDir));

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(metricsService.getPrometheusMetrics());
});

// Production Health check endpoint with database probe
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'connected';
  let latencyMs = 0;
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    latencyMs = Date.now() - start;
  } catch (e) {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Smart Clinic OS Node Express Backend',
    version: '2.1.0-production',
    port,
    database: {
      status: dbStatus,
      latencyMs,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      }
    },
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version
    }
  });
});

// Mount Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/clinic/patients', patientRoutes);
app.use('/api/v1/clinic/appointments', appointmentRoutes);
app.use('/api/v1/clinic/automation', automationRoutes);
app.use('/api/v1/clinic/queue', automationRoutes);
app.use('/api/v1/clinic/queue', queueRoutes);
app.use('/api/v1/clinic/billing', billingRoutes);
app.use('/api/v1/clinic/payments', billingRoutes);
app.use('/api/v1/clinic/walk-ins', appointmentRoutes);
app.use('/api/v1/clinic/ehr', ehrRoutes);
app.use('/api/v1/clinic/subscriptions', subscriptionRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/teleconsultation', teleconsultationRoutes);
app.use('/api/v1/abdm', abdmRoutes);
app.use('/api/v1/integrations', labIntegrationRoutes);
app.use('/api/v1/integrations', pharmacyIntegrationRoutes);
app.use('/api/v1/intelligence', clinicIntelligenceRoutes);
app.use('/api/v1/records', recordSharingRoutes);
app.use('/api/v1/admin/integrations', integrationAdminRoutes);
app.use('/api/v1/clinic', clinicRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/audit-logs', adminRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/patient', patientPortalRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal error occurred.',
    },
  });
});

// Start Server
if (require.main === module) {
  (async () => {
    try {
      await initializeDatabaseIfNeeded();
    } catch (e) {
      console.warn('DB initialization warning:', e.message);
    }

    server.listen(port, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`  Smart Clinic OS Express Backend running on port ${port}`);
      console.log(`  Health Check: http://localhost:${port}/api/v1/health`);
      console.log(`  Metrics Endpoint: http://localhost:${port}/metrics`);
      console.log(`=======================================================`);
    });
  })();

  // Graceful Shutdown
  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}. Gracefully closing HTTP server & PostgreSQL pool...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await pool.end();
        console.log('PostgreSQL connection pool drained.');
        process.exit(0);
      } catch (e) {
        console.error('Error draining pool:', e);
        process.exit(1);
      }
    });

    // Force exit after 10s if stuck
    setTimeout(() => {
      console.error('Forced shutdown after 10s timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, server };
