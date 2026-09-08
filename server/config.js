const path = require('path');
const dotenv = require('dotenv');

// Load server/.env first, then root .env (does not override values already set)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production' ;

function parseOrigins(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function parseDatabaseUrl(urlString) {
  const parsed = new URL(urlString);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, '').replace(/\/$/, ''));
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database
  };
}

function buildDbConfig() {
  if (process.env.DATABASE_URL) {
    return parseDatabaseUrl(process.env.DATABASE_URL);
  }

  return {
    host: process.env.DB_HOST || (isProduction ? '' : 'localhost'),
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || (isProduction ? '' : 'root'),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || (isProduction ? '' : 'tadkaplay_db')
  };
}

function buildSslConfig() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const sslEnabled =
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === '1' ||
    /ssl=true/i.test(databaseUrl) ||
    /ssl[-_]?mode=required/i.test(databaseUrl);

  if (!sslEnabled) return undefined;

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  };
}

function validateProductionEnv() {
  const missing = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    missing.push('JWT_SECRET (min 32 characters)');
  }

  if (!process.env.CLIENT_ORIGIN) {
    missing.push('CLIENT_ORIGIN');
  }

  const databaseDriver = process.env.DB_DRIVER || (process.env.MONGODB_URI ? 'mongodb' : 'mysql');
  const db = buildDbConfig();
  if (databaseDriver === 'mongodb' && !process.env.MONGODB_URI) {
    missing.push('MONGODB_URI');
  }
  if (databaseDriver !== 'mongodb' && !process.env.DATABASE_URL) {
    if (!db.host) missing.push('DB_HOST or DATABASE_URL');
    if (!db.user) missing.push('DB_USER or DATABASE_URL');
    if (!db.database) missing.push('DB_NAME or DATABASE_URL');
    if (!Object.prototype.hasOwnProperty.call(process.env, 'DB_PASSWORD') && !process.env.DATABASE_URL) {
      missing.push('DB_PASSWORD or DATABASE_URL');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Production startup blocked. Set these environment variables: ${missing.join(', ')}`
    );
  }
}

const jwtSecret = isProduction
  ? process.env.JWT_SECRET
  : process.env.JWT_SECRET || 'dev_only_insecure_jwt_secret_do_not_use_in_production';

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 5000,
  jwtSecret,
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  serveClient: process.env.SERVE_CLIENT !== 'false',
  validateProductionEnv,
  db: {
    ...buildDbConfig(),
    ssl: buildSslConfig(),
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10
  },
  databaseDriver: process.env.DB_DRIVER || (process.env.MONGODB_URI ? 'mongodb' : 'mysql'),
  mongodb: {
    uri: process.env.MONGODB_URI || '',
    database: process.env.MONGODB_DB || 'tadkaplay_db'
  }
};
