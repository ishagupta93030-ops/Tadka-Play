const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config');

// In-Memory Storage Fallback Engine for zero-setup execution if MySQL server is offline
class MemoryStore {
  constructor() {
    this.users = [];
    this.matches = [];
    this.predictions = [];
    this.coin_transactions = [];
    this.achievements = [];
    this.user_achievements = [];
    this.daily_rewards = [];
    this.notifications = [];
    this.audit_logs = [];
    this.autoIncrement = {
      users: 1,
      matches: 1,
      predictions: 1,
      coin_transactions: 1,
      achievements: 1,
      user_achievements: 1,
      daily_rewards: 1
      ,notifications: 1
      ,audit_logs: 1
    };
    this.isMemory = true;
  }

  async initializeDefaults() {
    if (this.users.length > 0) return;

    // Create Default Achievements
    const defaultAchievements = [
      { code: 'FIRST_PREDICTION', name: 'First Prediction', description: 'Placed your first prediction', icon: '🏆', coin_reward: 100, xp_reward: 50 },
      { code: 'CORRECT_5', name: '5 Correct Predictions', description: 'Predicted 5 matches correctly', icon: '🔥', coin_reward: 250, xp_reward: 150 },
      { code: 'WIN_STREAK_5', name: '5-Win Streak', description: 'Achieved a 5 match winning streak', icon: '⚡', coin_reward: 500, xp_reward: 300 },
      { code: 'ACCURACY_80', name: '80% Accuracy', description: 'Maintained 80%+ prediction accuracy', icon: '🎯', coin_reward: 300, xp_reward: 200 },
      { code: 'TOP_10', name: 'Top 10 Leaderboard', description: 'Reached the Top 10 on Leaderboard', icon: '👑', coin_reward: 1000, xp_reward: 500 }
      ,{ code: 'FIRST_WIN', name: 'First Win', description: 'Won your first prediction', icon: '🥇', coin_reward: 150, xp_reward: 75 }
      ,{ code: 'WINS_10', name: '10 Wins', description: 'Won 10 predictions', icon: '🏅', coin_reward: 500, xp_reward: 250 }
      ,{ code: 'WINS_25', name: '25 Wins', description: 'Won 25 predictions', icon: '💎', coin_reward: 1000, xp_reward: 500 }
      ,{ code: 'PREDICTIONS_50', name: '50 Predictions', description: 'Placed 50 predictions', icon: '🎯', coin_reward: 750, xp_reward: 350 }
      ,{ code: 'PREDICTIONS_100', name: '100 Predictions', description: 'Placed 100 predictions', icon: '🚀', coin_reward: 2000, xp_reward: 750 }
      ,{ code: 'STREAK_7', name: '7-Day Streak', description: 'Claimed rewards for seven days', icon: '🔥', coin_reward: 600, xp_reward: 300 }
      ,{ code: 'COIN_MILESTONE', name: 'Virtual Coin Milestone', description: 'Earned 2,000,000 virtual coins', icon: '🪙', coin_reward: 1000, xp_reward: 500 }
    ];

    for (const ach of defaultAchievements) {
      this.achievements.push({ id: this.autoIncrement.achievements++, ...ach });
    }

    // Default Admin User
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminUser = {
      id: this.autoIncrement.users++,
      name: 'Tadka Admin',
      email: 'admin@tadkaplay.com',
      password_hash: adminPasswordHash,
      coin_balance: 1000000,
      xp: 2500,
      level: 10,
      win_streak: 5,
      is_admin: 1,
      role: 'SUPER_MASTER',
      is_suspended: 0,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    this.users.push(adminUser);

    // Default Demo Users for Leaderboard
    const demoUsers = [
      { name: 'CricketKing_IN', email: 'king@tadkaplay.com', coins: 1450000, xp: 1800, level: 8, streak: 6, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
      { name: 'PredictionGuru', email: 'guru@tadkaplay.com', coins: 1210000, xp: 1400, level: 6, streak: 4, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      { name: 'SuperStriker99', email: 'striker@tadkaplay.com', coins: 980000, xp: 1100, level: 5, streak: 3, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
      { name: 'TadkaMaster', email: 'master@tadkaplay.com', coins: 840000, xp: 950, level: 4, streak: 2, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
      { name: 'CricketFanatic', email: 'fanatic@tadkaplay.com', coins: 620000, xp: 700, level: 3, streak: 1, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
    ];

    for (const u of demoUsers) {
      const uHash = await bcrypt.hash('password123', 10);
      this.users.push({
        id: this.autoIncrement.users++,
        name: u.name,
        email: u.email,
        password_hash: uHash,
        coin_balance: u.coins,
        xp: u.xp,
        level: u.level,
        win_streak: u.streak,
        is_admin: 0,
        role: 'USER',
        is_suspended: 0,
        avatar: u.avatar,
        created_at: new Date()
      });
    }

    // Default Matches
    const now = new Date();
    const future1 = new Date(now.getTime() + 2 * 3600 * 1000); // 2 hrs
    const future2 = new Date(now.getTime() + 14 * 3600 * 1000); // 14 hrs
    const past1 = new Date(now.getTime() - 24 * 3600 * 1000); // 1 day ago

    this.matches = [
      {
        id: this.autoIncrement.matches++,
        sport: 'cricket',
        team_a_name: 'India',
        team_a_logo: 'https://img.icons8.com/color/96/india-circular.png',
        team_b_name: 'Australia',
        team_b_logo: 'https://img.icons8.com/color/96/australia-circular.png',
        match_time: now,
        status: 'LIVE',
        winner_team: null,
        score_team_a: '186/4 (17.2 Ov)',
        score_team_b: '182/8 (20 Ov)',
        match_minute: '17.2 Overs - India need 3 runs off 16 balls',
        venue: 'Eden Gardens, Kolkata',
        league: 'T20 Championship Series',
        live_events_json: JSON.stringify([
          { time: '17.2', event: 'FOUR! Smashed down the ground by India captain!' },
          { time: '16.5', event: 'SIX! Huge hit over long-on!' },
          { time: '15.1', event: 'WICKET! Bowled him! Off stump knocked out.' }
        ]),
        created_at: now
      },
      {
        id: this.autoIncrement.matches++,
        sport: 'cricket',
        team_a_name: 'Chennai Kings',
        team_a_logo: 'https://img.icons8.com/emoji/96/lion-emoji.png',
        team_b_name: 'Mumbai Lions',
        team_b_logo: 'https://img.icons8.com/emoji/96/crown-emoji.png',
        match_time: future1,
        status: 'UPCOMING',
        winner_team: null,
        score_team_a: '0/0',
        score_team_b: '0/0',
        match_minute: 'Starts Soon',
        venue: 'Wankhede Stadium, Mumbai',
        league: 'Indian T20 Super League',
        live_events_json: JSON.stringify([]),
        created_at: now
      },
      {
        id: this.autoIncrement.matches++,
        sport: 'football',
        team_a_name: 'Real Madrid',
        team_a_logo: 'https://img.icons8.com/color/96/football2.png',
        team_b_name: 'Barcelona FC',
        team_b_logo: 'https://img.icons8.com/color/96/football.png',
        match_time: now,
        status: 'LIVE',
        winner_team: null,
        score_team_a: '2',
        score_team_b: '1',
        match_minute: "68'",
        venue: 'Santiago Bernabéu',
        league: 'European Champions League',
        live_events_json: JSON.stringify([
          { time: "65'", event: 'GOAL! Strikers clinical finish into top corner!' },
          { time: "42'", event: 'Yellow Card for mis-timed tackle' }
        ]),
        created_at: now
      },
      {
        id: this.autoIncrement.matches++,
        sport: 'football',
        team_a_name: 'Arsenal',
        team_a_logo: 'https://img.icons8.com/color/96/soccer-ball.png',
        team_b_name: 'Manchester City',
        team_b_logo: 'https://img.icons8.com/color/96/football-player.png',
        match_time: future2,
        status: 'UPCOMING',
        winner_team: null,
        score_team_a: '0',
        score_team_b: '0',
        match_minute: 'Tomorrow 19:30',
        venue: 'Emirates Stadium, London',
        league: 'Premier League',
        live_events_json: JSON.stringify([]),
        created_at: now
      },
      {
        id: this.autoIncrement.matches++,
        sport: 'tennis',
        team_a_name: 'Carlos Alcaraz',
        team_a_logo: 'https://img.icons8.com/color/96/tennis-racket.png',
        team_b_name: 'Novak Djokovic',
        team_b_logo: 'https://img.icons8.com/color/96/tennis-ball.png',
        match_time: future1,
        status: 'UPCOMING',
        winner_team: null,
        score_team_a: '0',
        score_team_b: '0',
        match_minute: 'Scheduled',
        venue: 'Centre Court, Wimbledon',
        league: 'Grand Slam Finals',
        live_events_json: JSON.stringify([]),
        created_at: now
      },
      {
        id: this.autoIncrement.matches++,
        sport: 'basketball',
        team_a_name: 'LA Lakers',
        team_a_logo: 'https://img.icons8.com/color/96/basketball.png',
        team_b_name: 'Golden State',
        team_b_logo: 'https://img.icons8.com/color/96/basketball-hoop.png',
        match_time: past1,
        status: 'COMPLETED',
        winner_team: 'LA Lakers',
        score_team_a: '112',
        score_team_b: '108',
        match_minute: 'Full Time',
        venue: 'Crypto.com Arena',
        league: 'NBA Championship',
        live_events_json: JSON.stringify([
          { time: 'Q4 0:05', event: 'Clutch free throws sealed the victory!' }
        ]),
        created_at: past1
      }
    ];

    console.log('⚡ Memory store initialized with default seed data.');
  }
}

let dbPool = null;
let memoryStore = new MemoryStore();
let useMySQL = false;

function poolOptions() {
  const { host, port, user, password, database, ssl, connectionLimit } = config.db;
  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    ...(ssl ? { ssl } : {})
  };
}

async function initDB() {
  const { host, port, user, password, database, ssl } = config.db;

  try {
    if (!config.isProduction && host && user && database) {
      const adminConn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        ...(ssl ? { ssl } : {})
      });
      await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      await adminConn.end();
    }

    dbPool = mysql.createPool(poolOptions());
    await dbPool.query('SELECT 1');
    useMySQL = true;
    await migrateSchema();
    console.log('Connected to MySQL database successfully.');
    return;
  } catch (err) {
    if (config.isProduction) {
      console.error('MySQL connection failed in production. In-memory fallback is disabled.');
      throw err;
    }

    console.log('MySQL connection failed (or no MySQL running locally):', err.message);
    console.log('Fallback to TadkaPlay in-memory store for local development only.');
    useMySQL = false;
    await memoryStore.initializeDefaults();
  }
}

// Additive migration for installations created with the original schema.
// Every statement is idempotent so existing user and prediction data is preserved.
async function migrateSchema() {
  const statements = [
    "ALTER TABLE users ADD COLUMN role ENUM('USER', 'MASTER', 'SUPER_MASTER') NOT NULL DEFAULT 'USER' AFTER is_admin",
    "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
    "ALTER TABLE users MODIFY coin_balance BIGINT UNSIGNED NOT NULL DEFAULT 1000000",
    "ALTER TABLE matches ADD COLUMN prediction_deadline DATETIME NULL AFTER match_time",
    "ALTER TABLE predictions MODIFY outcome ENUM('PENDING', 'WON', 'LOST', 'CANCELLED') NOT NULL DEFAULT 'PENDING'",
    "CREATE TABLE IF NOT EXISTS notifications (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, type VARCHAR(50) NOT NULL, message VARCHAR(255) NOT NULL, is_read TINYINT(1) NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_notifications_user_read (user_id, is_read, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "CREATE TABLE IF NOT EXISTS audit_logs (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, admin_user_id INT NOT NULL, admin_role VARCHAR(20) NOT NULL, action VARCHAR(100) NOT NULL, target_type VARCHAR(50) DEFAULT NULL, target_id VARCHAR(100) DEFAULT NULL, details JSON DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX idx_audit_created_at (created_at), INDEX idx_audit_admin (admin_user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    "UPDATE users SET role = CASE WHEN is_admin = 1 THEN 'SUPER_MASTER' ELSE 'USER' END WHERE role = 'USER' OR role IS NULL"
  ];

  for (const statement of statements) {
    try {
      await dbPool.query(statement);
    } catch (err) {
      // Duplicate-column/index errors are expected on already migrated databases.
      if (!/duplicate column|duplicate key name|already exists/i.test(err.message)) {
        throw err;
      }
    }
  }
}

// Universal query runner that works seamlessly whether MySQL is running or using MemoryStore
async function query(sql, params = []) {
  if (useMySQL && dbPool) {
    try {
      const [rows] = await dbPool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('MySQL Query Error:', err.message, '| SQL:', sql);
      throw err;
    }
  }

  // MemoryStore Query Handler for offline/demo operation
  await memoryStore.initializeDefaults();
  const lowerSql = sql.trim().toLowerCase();

  // 1. SELECT queries
  if (lowerSql.startsWith('select')) {
    if (sql.includes('FROM notifications')) {
      const userId = parseInt(params[0]);
      let rows = memoryStore.notifications.filter(n => n.user_id === userId);
      if (sql.includes('is_read = 0')) rows = rows.filter(n => !n.is_read);
      return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (sql.includes('FROM audit_logs')) return [...memoryStore.audit_logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sql.includes('FROM users WHERE email = ?')) {
      const u = memoryStore.users.find(x => x.email.toLowerCase() === params[0].toLowerCase());
      return u ? [u] : [];
    }
    if (sql.includes('FROM users WHERE id = ?')) {
      const u = memoryStore.users.find(x => x.id === parseInt(params[0]));
      return u ? [u] : [];
    }
    if (sql.includes('FROM users') && sql.includes('ORDER BY coin_balance')) {
      let res = [...memoryStore.users].sort((a, b) => b.coin_balance - a.coin_balance);
      if (sql.includes('LIMIT')) {
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        const lim = limitMatch ? parseInt(limitMatch[1]) : 50;
        res = res.slice(0, lim);
      }
      return res;
    }
    if (sql.includes('FROM users')) {
      return [...memoryStore.users];
    }
    if (sql.includes('FROM matches WHERE id = ?')) {
      const m = memoryStore.matches.find(x => x.id === parseInt(params[0]));
      return m ? [m] : [];
    }
    if (sql.includes('FROM matches WHERE status = ?')) {
      return memoryStore.matches.filter(x => x.status === params[0]);
    }
    if (sql.includes('FROM matches WHERE sport = ?')) {
      return memoryStore.matches.filter(x => x.sport === params[0]);
    }
    if (sql.includes('FROM matches')) {
      let list = [...memoryStore.matches];
      if (sql.includes('ORDER BY match_time DESC')) {
        list.sort((a, b) => new Date(b.match_time) - new Date(a.match_time));
      } else {
        list.sort((a, b) => new Date(a.match_time) - new Date(b.match_time));
      }
      return list;
    }
    if (sql.includes('FROM predictions WHERE user_id = ?')) {
      const preds = memoryStore.predictions.filter(x => x.user_id === parseInt(params[0]));
      return preds.map(p => {
        const match = memoryStore.matches.find(m => m.id === p.match_id) || {};
        return {
          ...p,
          sport: match.sport,
          team_a_name: match.team_a_name,
          team_b_name: match.team_b_name,
          team_a_logo: match.team_a_logo,
          team_b_logo: match.team_b_logo,
          match_status: match.status,
          score_team_a: match.score_team_a,
          score_team_b: match.score_team_b,
          winner_team: match.winner_team
        };
      });
    }
    if (sql.includes('FROM predictions WHERE match_id = ?')) {
      return memoryStore.predictions.filter(x => x.match_id === parseInt(params[0]));
    }
    if (sql.includes('FROM predictions')) {
      return [...memoryStore.predictions];
    }
    if (sql.includes('FROM coin_transactions WHERE user_id = ?')) {
      const txs = memoryStore.coin_transactions.filter(x => x.user_id === parseInt(params[0]));
      return txs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (sql.includes('FROM coin_transactions')) {
      return [...memoryStore.coin_transactions];
    }
    if (sql.includes('FROM achievements')) {
      return [...memoryStore.achievements];
    }
    if (sql.includes('FROM user_achievements WHERE user_id = ?')) {
      const uAchs = memoryStore.user_achievements.filter(x => x.user_id === parseInt(params[0]));
      return uAchs.map(ua => {
        const ach = memoryStore.achievements.find(a => a.id === ua.achievement_id);
        return { ...ua, ...ach };
      });
    }
    if (sql.includes('FROM daily_rewards WHERE user_id = ?')) {
      const r = memoryStore.daily_rewards.find(x => x.user_id === parseInt(params[0]));
      return r ? [r] : [];
    }
    return [];
  }

  // 2. INSERT queries
    if (lowerSql.startsWith('insert into users')) {
    const newUser = {
      id: memoryStore.autoIncrement.users++,
      name: params[0],
      email: params[1],
      password_hash: params[2],
        coin_balance: params[3] || 1000000,
      xp: 0,
      level: 1,
      win_streak: 0,
      is_admin: params[4] || 0,
      role: params[5] || ((params[4] || 0) ? 'SUPER_MASTER' : 'USER'),
      is_suspended: 0,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      created_at: new Date()
    };
    memoryStore.users.push(newUser);
    return { insertId: newUser.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('insert into matches')) {
    const newMatch = {
      id: memoryStore.autoIncrement.matches++,
      sport: params[0],
      team_a_name: params[1],
      team_a_logo: params[2],
      team_b_name: params[3],
      team_b_logo: params[4],
      match_time: params[5],
      status: params[6] || 'UPCOMING',
      venue: params[7] || 'Stadium',
      league: params[8] || 'League',
      score_team_a: '0',
      score_team_b: '0',
      match_minute: 'Scheduled',
      winner_team: null,
      live_events_json: JSON.stringify([]),
      created_at: new Date()
    };
    memoryStore.matches.push(newMatch);
    return { insertId: newMatch.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('insert into predictions')) {
    const newPred = {
      id: memoryStore.autoIncrement.predictions++,
      user_id: params[0],
      match_id: params[1],
      predicted_team: params[2],
      coins_staked: params[3],
      potential_reward: params[4],
      outcome: 'PENDING',
      created_at: new Date()
    };
    memoryStore.predictions.push(newPred);
    return { insertId: newPred.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('insert into coin_transactions')) {
    const newTx = {
      id: memoryStore.autoIncrement.coin_transactions++,
      user_id: params[0],
      amount: params[1],
      transaction_type: params[2],
      description: params[3],
      balance_after: params[4] !== undefined ? params[4] : null,
      created_at: new Date()
    };
    memoryStore.coin_transactions.push(newTx);
    return { insertId: newTx.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('insert into user_achievements')) {
    const newUA = {
      id: memoryStore.autoIncrement.user_achievements++,
      user_id: params[0],
      achievement_id: params[1],
      unlocked_at: new Date()
    };
    memoryStore.user_achievements.push(newUA);
    return { insertId: newUA.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('insert into daily_rewards')) {
    const newDR = {
      id: memoryStore.autoIncrement.daily_rewards++,
      user_id: params[0],
      streak_count: params[1],
      last_claimed_at: new Date()
    };
    const existingIdx = memoryStore.daily_rewards.findIndex(x => x.user_id === params[0]);
    if (existingIdx >= 0) {
      memoryStore.daily_rewards[existingIdx] = newDR;
    } else {
      memoryStore.daily_rewards.push(newDR);
    }
    return { insertId: newDR.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('insert into notifications')) {
    const notification = {
      id: memoryStore.autoIncrement.notifications++, user_id: params[0], type: params[1],
      message: params[2], is_read: 0, created_at: new Date()
    };
    memoryStore.notifications.push(notification);
    return { insertId: notification.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('insert into audit_logs')) {
    const audit = {
      id: memoryStore.autoIncrement.audit_logs++, admin_user_id: params[0], admin_role: params[1],
      action: params[2], target_type: params[3], target_id: params[4], details: params[5], created_at: new Date()
    };
    memoryStore.audit_logs.push(audit);
    return { insertId: audit.id, affectedRows: 1 };
  }

  // 3. UPDATE queries
  if (lowerSql.startsWith('update users')) {
    const userId = sql.includes('coin_balance = coin_balance -') && params.length >= 3 ? params[1] : params[params.length - 1];
    const user = memoryStore.users.find(u => u.id === parseInt(userId));
    if (user) {
      if (sql.includes('coin_balance = coin_balance +')) {
        user.coin_balance += params[0];
      } else if (sql.includes('coin_balance = coin_balance -')) {
        // Prevent negative balances in memory fallback: only deduct if sufficient funds
        const deduct = params[0];
        if (user.coin_balance >= deduct) {
          user.coin_balance -= deduct;
        } else {
          return { affectedRows: 0 };
        }
      } else if (sql.includes('coin_balance = ?')) {
        user.coin_balance = params[0];
      }
      if (sql.includes('xp = xp +')) {
        const xpLiteral = sql.match(/xp\s*=\s*xp\s*\+\s*(\d+)/i);
        user.xp += xpLiteral ? parseInt(xpLiteral[1]) : (params[1] || 0);
        user.level = Math.floor(user.xp / 300) + 1;
      }
      if (sql.includes('is_suspended = ?')) {
        user.is_suspended = params[0];
      }
      if (sql.includes('name = ?')) user.name = params[0];
      if (sql.includes('avatar = ?')) user.avatar = params[1];
      if (sql.includes('role = ?')) {
        user.role = params[0];
        user.is_admin = user.role === 'USER' ? 0 : 1;
      }
      return { affectedRows: 1 };
    }
  }

  if (lowerSql.startsWith('update notifications')) {
    const markAll = sql.toLowerCase().includes('where user_id = ?') && !sql.toLowerCase().includes('id = ?');
    const notificationId = markAll ? null : parseInt(params[0]);
    const userId = markAll ? parseInt(params[0]) : params.length > 1 ? parseInt(params[1]) : null;
    if (markAll) {
      memoryStore.notifications.filter(item => item.user_id === userId).forEach(item => { item.is_read = 1; });
      return { affectedRows: 1 };
    }
    const notification = memoryStore.notifications.find(item => item.id === notificationId && (!userId || item.user_id === userId));
    if (notification) notification.is_read = 1;
    return { affectedRows: notification ? 1 : 0 };
  }

  if (lowerSql.startsWith('update matches')) {
    const matchId = params[params.length - 1];
    const match = memoryStore.matches.find(m => m.id === parseInt(matchId));
    if (match) {
      if (sql.includes('status = ?') && sql.includes('score_team_a = ?')) {
        match.status = params[0];
        match.score_team_a = params[1];
        match.score_team_b = params[2];
        match.match_minute = params[3];
        match.winner_team = params[4];
        if (params[5]) match.live_events_json = params[5];
      } else if (sql.includes('status = ?')) {
        match.status = params[0];
        if (params[1]) match.winner_team = params[1];
      } else if (lowerSql.includes('status = "completed"')) {
        match.status = 'COMPLETED';
        match.winner_team = params[0];
      }
      return { affectedRows: 1 };
    }
  }

  if (lowerSql.startsWith('update predictions')) {
    const predId = params[params.length - 1];
    const pred = memoryStore.predictions.find(p => p.id === parseInt(predId));
    if (pred) {
      const outcomeMatch = sql.match(/outcome\s*=\s*"(PENDING|WON|LOST|CANCELLED)"/i);
      pred.outcome = outcomeMatch ? outcomeMatch[1].toUpperCase() : params[0];
      return { affectedRows: 1 };
    }
  }

  // 4. DELETE queries
  if (lowerSql.startsWith('delete from matches')) {
    const matchId = params[0];
    const idx = memoryStore.matches.findIndex(m => m.id === parseInt(matchId));
    if (idx >= 0) {
      memoryStore.matches.splice(idx, 1);
      return { affectedRows: 1 };
    }
  }

  return { affectedRows: 0 };
}

// Helper: get a raw MySQL connection for transactions (returns null when using in-memory store)
async function getConnection() {
  if (useMySQL && dbPool) {
    const conn = await dbPool.getConnection();
    return conn;
  }
  return null;
}

// Helper: run a query using a provided connection when available
async function queryWithConnection(conn, sql, params = []) {
  if (conn) {
    try {
      const [rows] = await conn.query(sql, params);
      return rows;
    } catch (err) {
      console.error('MySQL Query Error (conn):', err.message, '| SQL:', sql);
      throw err;
    }
  }

  // Fall back to default query implementation (memory or pool)
  return await query(sql, params);
}

module.exports = { initDB, query, getConnection, queryWithConnection, isUsingMySQL: () => useMySQL };
