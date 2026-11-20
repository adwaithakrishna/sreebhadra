const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const config = require('./config');
const models = require('./models');
const { errorHandler } = require('./middleware');
const { uploadRoot } = require('./services/storage');
const { reconcileLocks } = require('./services/availability');

let databaseReady;
async function initializeDatabase() {
  if (!databaseReady) {
    databaseReady = (async () => {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
      await Promise.all(Object.values(models).map((model) => model.init()));
      const dropped = await reconcileLocks();
      if (dropped) console.log(`Released ${dropped} orphaned date lock(s)`);
    })().catch((err) => {
      databaseReady = null;
      throw err;
    });
  }
  return databaseReady;
}

function createApp() {
  const app = express();
  app.set('trust proxy', 1); // correct client IPs for rate limiting behind one proxy/load balancer

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // lets the dev client show /uploads images
    })
  );
  if (config.clientOrigins.length) app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  app.use('/uploads', express.static(uploadRoot, { maxAge: '7d', index: false, dotfiles: 'deny' }));

  const publicLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
  app.use('/api', (req, res, next) => initializeDatabase().then(() => next()).catch(next));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api', (req, res, next) => (req.method === 'POST' ? publicLimiter(req, res, next) : next()), require('./routes/public'));
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found.' }));

  // In production, serve the built React app from the same origin (keeps admin cookies same-site).
  const dist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}

// Vercel's Express runtime expects the Express application itself as the
// module export. Keep the named helpers attached for the local server entry.
const app = createApp();
module.exports = app;
module.exports.createApp = createApp;
module.exports.initializeDatabase = initializeDatabase;
