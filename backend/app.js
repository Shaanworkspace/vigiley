const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const adminRoutes = require('./routes/admin');
const alertRoutes = require('./routes/alert');
const reportRoutes = require('./routes/report');
const { createRateLimiter } = require('./middleware/rateLimit');

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://vigileye-driver.vercel.app',
  'https://vigileye-admin.vercel.app',
  'https://vigileye-landing.vercel.app',
];

const allowedOrigins = () =>
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;

/**
 * Builds the Express app without opening a port or a DB connection,
 * so tests can exercise routes directly.
 */
function createApp({ io = null, dbReady = () => true } = {}) {
  const app = express();

  app.use(cors({ origin: allowedOrigins(), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.use(createRateLimiter({ exempt: ['/api/health', '/api/wake-up'] }));

  app.use('/api/auth', authRoutes);
  app.use('/api/driver', driverRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/reports', reportRoutes);

  app.get('/api/health', (req, res) => {
    const db = dbReady();
    res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db, timestamp: new Date().toISOString() });
  });

  app.get('/api/wake-up', (req, res) => {
    res.json({ status: 'awake', message: 'Server is ready' });
  });

  // Seeding is a CLI-only task (`npm run seed`); there is deliberately no HTTP seed endpoint.

  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error('[unhandled]', req.method, req.path, err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp, allowedOrigins };
