const { initDB, query, isUsingMySQL } = require('./db');
const bcrypt = require('bcryptjs');

async function runSeed() {
  console.log('🌱 Seeding TadkaPlay database...');
  await initDB();

  try {
    // 1. Achievements Seed
    const achievements = [
      ['FIRST_PREDICTION', 'First Prediction', 'Placed your first prediction', '🏆', 100, 50],
      ['CORRECT_5', '5 Correct Predictions', 'Predicted 5 matches correctly', '🔥', 250, 150],
      ['WIN_STREAK_5', '5-Win Streak', 'Achieved a 5 match winning streak', '⚡', 500, 300],
      ['ACCURACY_80', '80% Accuracy', 'Maintained 80%+ prediction accuracy', '🎯', 300, 200],
      ['TOP_10', 'Top 10 Leaderboard', 'Reached the Top 10 on Leaderboard', '👑', 1000, 500]
      ,['FIRST_WIN', 'First Win', 'Won your first prediction', '🥇', 150, 75]
      ,['WINS_10', '10 Wins', 'Won 10 predictions', '🏅', 500, 250]
      ,['WINS_25', '25 Wins', 'Won 25 predictions', '💎', 1000, 500]
      ,['PREDICTIONS_50', '50 Predictions', 'Placed 50 predictions', '🎯', 750, 350]
      ,['PREDICTIONS_100', '100 Predictions', 'Placed 100 predictions', '🚀', 2000, 750]
      ,['STREAK_7', '7-Day Streak', 'Claimed rewards for seven days', '🔥', 600, 300]
      ,['COIN_MILESTONE', 'Virtual Coin Milestone', 'Earned 2,000,000 virtual coins', '🪙', 1000, 500]
    ];

    for (const ach of achievements) {
      await query(
        `INSERT IGNORE INTO achievements (code, name, description, icon, coin_reward, xp_reward) VALUES (?, ?, ?, ?, ?, ?)`,
        ach
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tadkaplay.com';
    const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin123');

    if (!adminPassword) {
      throw new Error('Set ADMIN_PASSWORD before seeding in production.');
    }

    const adminPass = await bcrypt.hash(adminPassword, 10);
    const existingAdmin = await query(`SELECT id FROM users WHERE email = ?`, [adminEmail]);

    if (existingAdmin.length === 0) {
      await query(
        `INSERT INTO users (name, email, password_hash, coin_balance, xp, level, win_streak, is_admin, avatar) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Tadka Admin', adminEmail, adminPass, 1000000, 2500, 10, 5, 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150']
      );
      console.log(`Admin user created: ${adminEmail} (password not logged)`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    // 3. Demo Matches
    const demoMatches = [
      ['cricket', 'India', 'https://img.icons8.com/color/96/india-circular.png', 'Australia', 'https://img.icons8.com/color/96/australia-circular.png', new Date(), 'LIVE', 'Eden Gardens, Kolkata', 'T20 Championship Series'],
      ['cricket', 'Chennai Kings', 'https://img.icons8.com/emoji/96/lion-emoji.png', 'Mumbai Lions', 'https://img.icons8.com/emoji/96/crown-emoji.png', new Date(Date.now() + 7200000), 'UPCOMING', 'Wankhede Stadium, Mumbai', 'Indian T20 Super League'],
      ['football', 'Real Madrid', 'https://img.icons8.com/color/96/football2.png', 'Barcelona FC', 'https://img.icons8.com/color/96/football.png', new Date(), 'LIVE', 'Santiago Bernabéu', 'European Champions League'],
      ['football', 'Arsenal', 'https://img.icons8.com/color/96/soccer-ball.png', 'Manchester City', 'https://img.icons8.com/color/96/football-player.png', new Date(Date.now() + 43200000), 'UPCOMING', 'Emirates Stadium, London', 'Premier League'],
      ['tennis', 'Carlos Alcaraz', 'https://img.icons8.com/color/96/tennis-racket.png', 'Novak Djokovic', 'https://img.icons8.com/color/96/tennis-ball.png', new Date(Date.now() + 18000000), 'UPCOMING', 'Centre Court, Wimbledon', 'Grand Slam Finals'],
      ['basketball', 'LA Lakers', 'https://img.icons8.com/color/96/basketball.png', 'Golden State', 'https://img.icons8.com/color/96/basketball-hoop.png', new Date(Date.now() - 86400000), 'COMPLETED', 'Crypto.com Arena', 'NBA Championship']
    ];

    for (const m of demoMatches) {
      await query(
        `INSERT INTO matches (sport, team_a_name, team_a_logo, team_b_name, team_b_logo, match_time, status, venue, league)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        m
      );
    }

    console.log('🎉 Seed completed successfully!');
  } catch (err) {
    console.error('Seed Error:', err.message);
  }
}

if (require.main === module) {
  runSeed().then(() => process.exit(0));
}

module.exports = { runSeed };
