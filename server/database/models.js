const mongoose = require('mongoose');

const { Schema } = mongoose;
const numericId = { type: Number, required: true, index: true };
const dateField = { type: Date, default: Date.now };

function model(name, collection, definition, indexes = []) {
  const schema = new Schema(definition, {
    collection,
    versionKey: false,
    strict: true
  });
  indexes.forEach(index => schema.index(index.fields, index.options));
  return mongoose.models[name] || mongoose.model(name, schema);
}

const User = model('User', 'users', {
  id: numericId,
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  coin_balance: { type: Number, default: 0, min: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  win_streak: { type: Number, default: 0 },
  is_admin: { type: Number, default: 0 },
  role: { type: String, enum: ['USER', 'MASTER', 'SUPER_MASTER'], default: 'USER' },
  is_suspended: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  created_at: dateField,
  updated_at: dateField
}, [{ fields: { email: 1 }, options: { unique: true } }]);

const Match = model('Match', 'matches', {
  id: numericId,
  sport: { type: String, enum: ['cricket', 'football', 'tennis', 'basketball'] },
  team_a_name: String,
  team_a_logo: String,
  team_b_name: String,
  team_b_logo: String,
  match_time: Date,
  prediction_deadline: Date,
  status: { type: String, enum: ['UPCOMING', 'LIVE', 'COMPLETED'], default: 'UPCOMING' },
  winner_team: String,
  score_team_a: { type: String, default: '0' },
  score_team_b: { type: String, default: '0' },
  match_minute: String,
  venue: String,
  league: String,
  live_events_json: { type: Schema.Types.Mixed, default: [] },
  created_at: dateField
}, [
  { fields: { status: 1 } },
  { fields: { sport: 1 } },
  { fields: { match_time: 1 } }
]);

const Prediction = model('Prediction', 'predictions', {
  id: numericId,
  user_id: { type: Number, required: true },
  match_id: { type: Number, required: true },
  predicted_team: { type: String, required: true },
  coins_staked: { type: Number, required: true, min: 1 },
  potential_reward: { type: Number, required: true, min: 0 },
  outcome: { type: String, enum: ['PENDING', 'WON', 'LOST', 'CANCELLED'], default: 'PENDING' },
  created_at: dateField
}, [
  { fields: { user_id: 1, match_id: 1 }, options: { unique: true } },
  { fields: { user_id: 1 } },
  { fields: { match_id: 1 } },
  { fields: { outcome: 1 } }
]);

const CoinTransaction = model('CoinTransaction', 'coin_transactions', {
  id: numericId,
  user_id: { type: Number, required: true },
  amount: { type: Number, required: true },
  transaction_type: { type: String, required: true, enum: ['REGISTRATION_BONUS', 'DAILY_REWARD', 'STREAK_BONUS', 'PREDICTION_STAKE', 'PREDICTION_WIN', 'ACHIEVEMENT_REWARD', 'ADMIN_ADJUSTMENT', 'WHEEL_SPIN'] },
  description: { type: String, required: true },
  balance_after: Number,
  created_at: dateField
}, [{ fields: { user_id: 1, created_at: -1 } }]);

const Achievement = model('Achievement', 'achievements', {
  id: numericId,
  code: { type: String, required: true },
  name: String,
  description: String,
  icon: String,
  coin_reward: { type: Number, default: 100 },
  xp_reward: { type: Number, default: 50 }
}, [{ fields: { code: 1 }, options: { unique: true } }]);

const UserAchievement = model('UserAchievement', 'user_achievements', {
  id: numericId,
  user_id: { type: Number, required: true },
  achievement_id: { type: Number, required: true },
  unlocked_at: dateField
}, [{ fields: { user_id: 1, achievement_id: 1 }, options: { unique: true } }]);

const DailyReward = model('DailyReward', 'daily_rewards', {
  id: numericId,
  user_id: { type: Number, required: true },
  streak_count: { type: Number, default: 1 },
  last_claimed_at: { type: Date, required: true }
}, [{ fields: { user_id: 1 }, options: { unique: true } }]);

const WheelSpin = model('WheelSpin', 'wheel_spins', {
  id: numericId,
  user_id: { type: Number, required: true },
  reward_amount: { type: Number, required: true, min: 0, max: 50000 },
  luck_score: { type: Number, required: true, min: 0, max: 100 },
  spun_at: dateField
}, [{ fields: { user_id: 1, spun_at: -1 } }]);

const Notification = model('Notification', 'notifications', {
  id: numericId,
  user_id: { type: Number, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true, maxlength: 255 },
  is_read: { type: Number, default: 0 },
  created_at: dateField
}, [{ fields: { user_id: 1, is_read: 1, created_at: -1 } }]);

const AuditLog = model('AuditLog', 'audit_logs', {
  id: numericId,
  admin_user_id: { type: Number, required: true },
  admin_role: { type: String, required: true },
  action: { type: String, required: true },
  target_type: String,
  target_id: String,
  details: { type: Schema.Types.Mixed, default: {} },
  created_at: dateField
}, [
  { fields: { created_at: -1 } },
  { fields: { admin_user_id: 1 } }
]);

const Counter = model('Counter', '_counters', {
  _id: { type: String, required: true },
  value: { type: Number, default: 0 }
});

module.exports = {
  User,
  Match,
  Prediction,
  CoinTransaction,
  Achievement,
  UserAchievement,
  DailyReward,
  WheelSpin,
  Notification,
  AuditLog,
  Counter
};
