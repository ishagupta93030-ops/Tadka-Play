const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const config = require('../config');

const TABLES = [
  'users', 'matches', 'predictions', 'coin_transactions', 'achievements',
  'user_achievements', 'daily_rewards', 'wheel_spins', 'notifications', 'audit_logs'
];
const batchSize = 500;
const dryRun = process.argv.includes('--dry-run');
const resume = process.argv.includes('--resume');

function parseJson(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function normalize(row) {
  const result = { ...row };
  if (result.email) result.email = String(result.email).trim().toLowerCase();
  if (result.live_events_json) result.live_events_json = parseJson(result.live_events_json);
  if (result.details) result.details = parseJson(result.details);
  return result;
}

async function readTable(connection, table) {
  const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
  return rows.map(normalize);
}

async function ensureIndexes(database) {
  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('predictions').createIndex({ user_id: 1, match_id: 1 }, { unique: true }),
    database.collection('user_achievements').createIndex({ user_id: 1, achievement_id: 1 }, { unique: true }),
    database.collection('daily_rewards').createIndex({ user_id: 1 }, { unique: true }),
    database.collection('wheel_spins').createIndex({ user_id: 1, spun_at: -1 }),
    database.collection('achievements').createIndex({ code: 1 }, { unique: true }),
    database.collection('notifications').createIndex({ user_id: 1, is_read: 1, created_at: -1 }),
    database.collection('matches').createIndex({ status: 1 }),
    database.collection('matches').createIndex({ sport: 1 }),
    database.collection('matches').createIndex({ match_time: 1 }),
    database.collection('predictions').createIndex({ user_id: 1 }),
    database.collection('predictions').createIndex({ match_id: 1 }),
    database.collection('predictions').createIndex({ outcome: 1 }),
    database.collection('coin_transactions').createIndex({ user_id: 1, created_at: -1 }),
    database.collection('audit_logs').createIndex({ created_at: -1 }),
    database.collection('audit_logs').createIndex({ admin_user_id: 1 })
  ]);
}

async function upsertRows(database, table, rows) {
  if (!rows.length || dryRun) return;
  const collection = database.collection(table);
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    await collection.bulkWrite(batch.map(row => ({
      replaceOne: { filter: { id: row.id }, replacement: row, upsert: true }
    })), { ordered: false });
  }
}

async function runMigration() {
  if (!config.db.host || !config.db.user || !config.db.database) {
    throw new Error('Set legacy MySQL DB_HOST, DB_USER, DB_PASSWORD and DB_NAME before migrating.');
  }
  if (!config.mongodb.uri) throw new Error('Set MONGODB_URI before migrating.');

  const mysqlConnection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    ...(config.db.ssl ? { ssl: config.db.ssl } : {})
  });
  const mongoClient = new MongoClient(config.mongodb.uri);
  await mongoClient.connect();
  const database = mongoClient.db(config.mongodb.database);

  try {
    await ensureIndexes(database);
    const counts = {};
    for (const table of TABLES) {
      const rows = await readTable(mysqlConnection, table);
      counts[table] = rows.length;
      await upsertRows(database, table, rows);
      console.log(`${dryRun ? 'Would migrate' : 'Migrated'} ${rows.length} ${table}`);
    }

    if (!dryRun) {
      const counters = database.collection('_counters');
      for (const table of TABLES) {
        const max = await database.collection(table).findOne({}, { sort: { id: -1 }, projection: { id: 1 } });
        await counters.updateOne({ _id: table }, { $max: { value: Number(max?.id || 0) } }, { upsert: true });
      }
      const orphanPredictions = await database.collection('predictions').countDocuments({ $or: [
        { user_id: { $nin: (await database.collection('users').find({}, { projection: { id: 1 } }).toArray()).map(row => row.id) } },
        { match_id: { $nin: (await database.collection('matches').find({}, { projection: { id: 1 } }).toArray()).map(row => row.id) } }
      ] });
      if (orphanPredictions > 0) throw new Error(`Migration validation found ${orphanPredictions} orphan predictions.`);
      await database.collection('_migration_runs').insertOne({ started_at: new Date(), completed_at: new Date(), resume, counts });
    }
    console.log(JSON.stringify({ dryRun, resume, counts }, null, 2));
  } finally {
    await mysqlConnection.end();
    await mongoClient.close();
  }
}

if (require.main === module) {
  runMigration().catch(error => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { runMigration };
