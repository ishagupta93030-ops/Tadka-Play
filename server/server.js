const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { initDB, isUsingMongo, isUsingMySQL } = require('./database/db');
const config = require('./config');

const app = express();
const PORT = config.port;

app.disable('x-powered-by');
app.set('trust proxy', 1);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (!config.isProduction) {
      return callback(null, true);
    }

    const normalized = origin.replace(/\/$/, '');
    if (config.clientOrigins.includes(normalized)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const predictionRoutes = require('./routes/predictions');
const walletRoutes = require('./routes/wallet');
const leaderboardRoutes = require('./routes/leaderboard');
const achievementRoutes = require('./routes/achievements');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'TadkaPlay Backend API',
    environment: config.isProduction ? 'production' : 'development',
    database: isUsingMongo() ? 'mongodb' : isUsingMySQL() ? 'mysql' : 'memory-fallback',
    disclaimer: 'Virtual coins only. No real-money deposits, withdrawals or cash prizes.',
    timestamp: new Date()
  });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const shouldServeClient = config.serveClient && fs.existsSync(path.join(clientDist, 'index.html'));

if (shouldServeClient) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Handle malformed JSON body errors from body-parser
app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON payload:', err.stack || err);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload.' });
  }
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Origin not allowed by CORS.' });
  }
  console.error('Unhandled error:', err.stack || err);
  return res.status(500).json({ success: false, message: 'Internal server error.' });
});

async function startServer() {
  if (config.isProduction) {
    config.validateProductionEnv();
  }
  await initDB();
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`TadkaPlay API Server running on port ${PORT}`);
    console.log(`Database mode: ${isUsingMongo() ? 'MongoDB' : isUsingMySQL() ? 'MySQL' : 'in-memory fallback'}`);
    console.log('FREE-TO-PLAY VIRTUAL COINS ONLY - ZERO REAL MONEY INVOLVED');
    if (shouldServeClient) {
      console.log('Serving React production build from client/dist');
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing TadkaPlay server or set a different PORT.`);
    } else {
      console.error('Backend listener error:', err.message);
    }
    process.exitCode = 1;
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
