const mongoose = require('mongoose');
const models = require('./models');

const COLLECTIONS = [
  'users', 'matches', 'predictions', 'coin_transactions', 'achievements',
  'user_achievements', 'daily_rewards', 'wheel_spins', 'notifications', 'audit_logs'
];

let database;
let counters;

const modelByCollection = Object.values(models).reduce((result, currentModel) => {
  result[currentModel.collection.name] = currentModel;
  return result;
}, {});

function parseJson(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function normalizeDocument(document) {
  if (!document) return document;
  const result = { ...document };
  delete result._id;
  if (result.live_events_json) result.live_events_json = parseJson(result.live_events_json);
  if (result.details) result.details = parseJson(result.details);
  return result;
}

function collectionName(sql) {
  const match = sql.match(/(?:FROM|INTO|UPDATE|TABLE)\s+([a-z_]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function projectionFromSql(sql) {
  const match = sql.match(/^\s*SELECT\s+(.+?)\s+FROM\s+/i);
  if (!match || match[1].trim() === '*') return undefined;
  const projection = {};
  match[1].split(',').forEach(field => {
    const name = field.trim().split(/\s+/).pop();
    if (name && /^[a-z_]+$/i.test(name)) projection[name] = 1;
  });
  return projection;
}

function nextId(collection) {
  return counters.findOneAndUpdate(
    { _id: collection },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: 'after' }
  ).then(result => {
    const counter = result?.value && typeof result.value === 'object' ? result.value : result;
    return Number(counter?.value || 0);
  });
}

function getCollection(name) {
  return modelByCollection[name]?.collection || database.collection(name);
}

async function repairMissingIds() {
  for (const name of COLLECTIONS) {
    const collection = getCollection(name);
    const missing = await collection.find({ $or: [{ id: null }, { id: { $exists: false } }] }).project({ _id: 1 }).toArray();
    for (const document of missing) {
      const id = await nextId(name);
      await collection.updateOne({ _id: document._id }, { $set: { id } });
    }
  }
}

function baseFilter(sql, params) {
  const lower = sql.toLowerCase();
  if (lower.includes('where email = ?')) return { email: String(params[0]).trim().toLowerCase() };
  if (lower.includes('where user_id = ? and match_id = ?')) return { user_id: Number(params[0]), match_id: Number(params[1]) };
  if (lower.includes('where id = ? and user_id = ?')) return { id: Number(params[0]), user_id: Number(params[1]) };
  if (lower.includes('where user_id = ?')) return { user_id: Number(params[0]) };
  if (lower.includes('where match_id = ?')) return { match_id: Number(params[0]) };
  if (lower.includes('where id = ? and coin_balance >= ?')) return { id: Number(params[params.length - 2]), coin_balance: { $gte: Number(params[params.length - 1]) } };
  if (lower.includes('where id = ?')) {
    const isWrite = lower.startsWith('update') || lower.startsWith('delete');
    return { id: Number(isWrite ? params[params.length - 1] : params[0]) };
  }
  if (lower.includes('where status = ?')) return { status: params[0] };
  if (lower.includes('where sport = ?')) return { sport: params[0] };
  return {};
}

function valuesFromSql(sql, params) {
  const match = sql.match(/VALUES\s*\(([^)]+)\)/i);
  if (!match) return params;
  const values = match[1].split(',').map(value => value.trim());
  let parameterIndex = 0;
  return values.map(value => {
    if (value === '?') return params[parameterIndex++];
    if (/^null$/i.test(value)) return null;
    if (/^'.*'$/.test(value)) return value.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    return value;
  });
}

async function initializeMongo(uri, dbName) {
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
  database = mongoose.connection.db;
  counters = models.Counter.collection;

  await Promise.all([
    ...Object.values(models).map(currentModel => currentModel.createIndexes())
  ]);

  for (const name of COLLECTIONS) {
    const max = await database.collection(name).findOne({}, { sort: { id: -1 }, projection: { id: 1 } });
    await counters.updateOne({ _id: name }, { $max: { value: Number(max?.id || 0) } }, { upsert: true });
  }
  await repairMissingIds();
  console.log(`Connected to MongoDB database ${dbName}.`);
}

async function closeMongo() {
  await mongoose.disconnect();
}

async function runQuery(sql, params = [], session = undefined) {
  const trimmed = sql.trim();
  const lower = trimmed.toLowerCase();
  const name = collectionName(trimmed);
  if (!name) return [];
  const collection = getCollection(name);

  if (lower.startsWith('select')) {
    const filter = baseFilter(trimmed, params);
    if (lower.includes('is_read = 0')) filter.is_read = 0;
    let cursor = collection.find(filter, { projection: projectionFromSql(trimmed), session });
    if (lower.includes('order by coin_balance')) cursor = cursor.sort({ coin_balance: -1 });
    else if (lower.includes('order by id desc')) cursor = cursor.sort({ id: -1 });
    else if (lower.includes('order by match_time desc')) cursor = cursor.sort({ match_time: -1 });
    else if (lower.includes('order by match_time')) cursor = cursor.sort({ match_time: 1 });
    else if (lower.includes('order by created_at desc')) cursor = cursor.sort({ created_at: -1 });
    if (lower.includes('limit')) {
      const match = lower.match(/limit\s+(\d+)/);
      if (match) cursor = cursor.limit(Number(match[1]));
    }
    const rows = (await cursor.toArray()).map(normalizeDocument);
    if (name === 'predictions' && lower.includes('where user_id')) {
      const matches = database.collection('matches');
      for (const row of rows) {
        const match = await matches.findOne({ id: row.match_id }, { session });
        if (match) Object.assign(row, {
          sport: match.sport, team_a_name: match.team_a_name, team_b_name: match.team_b_name,
          team_a_logo: match.team_a_logo, team_b_logo: match.team_b_logo, match_status: match.status,
          score_team_a: match.score_team_a, score_team_b: match.score_team_b, winner_team: match.winner_team
        });
      }
    }
    return rows;
  }

  if (lower.startsWith('insert')) {
    const columnsMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i);
    const columns = columnsMatch ? columnsMatch[1].split(',').map(column => column.trim()) : [];
    const values = valuesFromSql(trimmed, params);
    const document = {};
    columns.forEach((column, index) => { document[column] = values[index]; });
    if (document.email) document.email = String(document.email).trim().toLowerCase();
    if (name === 'daily_rewards' && lower.includes('on duplicate key update')) {
      const existing = await collection.findOne({ user_id: Number(document.user_id) }, { session });
      if (existing) {
        await collection.updateOne({ user_id: Number(document.user_id) }, { $set: { streak_count: document.streak_count, last_claimed_at: document.last_claimed_at } }, { session });
        return { insertId: existing.id, affectedRows: 1 };
      }
    }
    document.id = await nextId(name);
    document.created_at = document.created_at || new Date();
    if (name === 'users') Object.assign(document, { xp: document.xp ?? 0, level: document.level ?? 1, win_streak: document.win_streak ?? 0, is_admin: document.is_admin ?? 0, role: document.role || (document.is_admin ? 'SUPER_MASTER' : 'USER'), is_suspended: 0 });
    if (name === 'matches') Object.assign(document, { status: document.status || 'UPCOMING', score_team_a: document.score_team_a || '0', score_team_b: document.score_team_b || '0', live_events_json: document.live_events_json || [] });
    if (name === 'predictions') Object.assign(document, { outcome: document.outcome || 'PENDING' });
    if (name === 'notifications') Object.assign(document, { is_read: 0 });
    if (name === 'daily_rewards') document.last_claimed_at = document.last_claimed_at || new Date();
    try {
      await collection.insertOne(document, { session });
    } catch (error) {
      if (lower.includes('insert ignore') && error.code === 11000) return { affectedRows: 0, insertId: null };
      if (error.code === 11000) error.code = 'ER_DUP_ENTRY';
      throw error;
    }
    return { insertId: document.id, affectedRows: 1 };
  }

  if (lower.startsWith('update')) {
    const filter = baseFilter(trimmed, params);
    let update = {};
    if (name === 'users') {
      const set = {};
      if (lower.includes('name = ?')) set.name = params[0];
      if (lower.includes('avatar = ?')) set.avatar = params[1];
      if (lower.includes('is_suspended = ?')) set.is_suspended = params[0];
      if (lower.includes('role = ?')) { set.role = params[0]; set.is_admin = params[0] === 'USER' ? 0 : 1; }
      if (Object.keys(set).length) update.$set = set;
      if (lower.includes('coin_balance = coin_balance +')) update.$inc = { ...(update.$inc || {}), coin_balance: Number(params[0]) };
      if (lower.includes('coin_balance = coin_balance -')) update.$inc = { ...(update.$inc || {}), coin_balance: -Number(params[0]) };
      if (lower.includes('xp = xp +')) update.$inc = { ...(update.$inc || {}), xp: Number((trimmed.match(/xp\s*=\s*xp\s*\+\s*(\d+)/i) || [])[1] || params[1] || 0) };
      if (lower.includes('win_streak = win_streak +')) update.$inc = { ...(update.$inc || {}), win_streak: 1 };
      if (lower.includes('win_streak = 0')) update.$set = { ...(update.$set || {}), win_streak: 0 };
      if (lower.includes('coin_balance >= ?')) filter.coin_balance = { $gte: Number(params[params.length - 1]) };
    } else if (name === 'matches') {
      const set = {};
      ['sport', 'team_a_name', 'team_a_logo', 'team_b_name', 'team_b_logo', 'match_time', 'status', 'venue', 'league', 'score_team_a', 'score_team_b', 'match_minute', 'winner_team'].forEach((field, index) => { if (lower.includes(`${field} = ?`)) set[field] = params[index]; });
      if (lower.includes('live_events_json = ?')) set.live_events_json = parseJson(params[params.length - 2] || params[params.length - 1]);
      if (lower.includes('status = "completed"')) { set.status = 'COMPLETED'; set.winner_team = params[0]; }
      update.$set = set;
    } else if (name === 'predictions') {
      const outcome = (trimmed.match(/outcome\s*=\s*"(PENDING|WON|LOST|CANCELLED)"/i) || [])[1];
      update.$set = { outcome: outcome || params[0] };
    } else if (name === 'notifications') {
      update.$set = { is_read: 1 };
    }
    const result = await collection.updateOne(filter, update, { session });
    return { affectedRows: result.matchedCount };
  }

  if (lower.startsWith('delete')) {
    const result = await collection.deleteOne(baseFilter(trimmed, params), { session });
    return { affectedRows: result.deletedCount };
  }
  return { affectedRows: 0 };
}

async function mongoQuery(sql, params = []) { return runQuery(sql, params); }

async function getMongoConnection() {
  const session = await mongoose.startSession();
  return {
    session,
    async beginTransaction() { session.startTransaction(); },
    async commit() { await session.commitTransaction(); },
    async rollback() { await session.abortTransaction(); },
    async release() { await session.endSession(); },
    async query(sql, params) { return [await runQuery(sql, params, session)]; }
  };
}

async function mongoQueryWithConnection(connection, sql, params = []) {
  if (connection) return runQuery(sql, params, connection.session);
  return mongoQuery(sql, params);
}

module.exports = { initializeMongo, closeMongo, mongoQuery, getMongoConnection, mongoQueryWithConnection };
