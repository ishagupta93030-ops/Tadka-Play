const express = require('express');
const { query, getConnection, queryWithConnection } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET WALLET DETAILS & TRANSACTIONS
router.get('/details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await query('SELECT coin_balance, xp, level FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const transactions = await query(
      'SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [userId]
    );

    // Get daily reward info
    const dailyRecords = await query('SELECT * FROM daily_rewards WHERE user_id = ?', [userId]);
    let streakCount = 1;
    let canClaimDaily = true;
    let lastClaimedAt = null;

    if (dailyRecords.length > 0) {
      const rec = dailyRecords[0];
      lastClaimedAt = rec.last_claimed_at;
      streakCount = rec.streak_count;

      const lastDate = new Date(lastClaimedAt);
      const now = new Date();
      const diffHours = (now - lastDate) / (1000 * 3600);

      if (diffHours < 24 && lastDate.getDate() === now.getDate()) {
        canClaimDaily = false;
      } else if (diffHours >= 48) {
        // Streak broken
        streakCount = 1;
      }
    }

    return res.json({
      success: true,
      balance: users[0].coin_balance,
      xp: users[0].xp,
      level: users[0].level,
      dailyReward: {
        canClaim: canClaimDaily,
        streakCount,
        lastClaimedAt
      },
      transactions
    });
  } catch (err) {
    console.error('Wallet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch wallet information.' });
  }
});

// CLAIM DAILY REWARD COINS
router.post('/claim-daily', authenticateToken, async (req, res) => {
  return res.status(403).json({ success: false, message: 'Only a Master can provide virtual coins.' });
  try {
    const userId = req.user.id;

    const dailyRecords = await query('SELECT * FROM daily_rewards WHERE user_id = ?', [userId]);
    const now = new Date();
    let streak = 1;

    if (dailyRecords.length > 0) {
      const rec = dailyRecords[0];
      const lastDate = new Date(rec.last_claimed_at);
      const diffHours = (now - lastDate) / (1000 * 3600);

      if (diffHours < 24 && lastDate.getDate() === now.getDate()) {
        return res.status(400).json({
          success: false,
          message: 'You have already claimed your daily reward today! Come back tomorrow.'
        });
      }

      if (diffHours < 48) {
        streak = (rec.streak_count % 7) + 1;
      } else {
        streak = 1; // reset streak if missed a day
      }
    }

    // Reward table by streak day
    const STREAK_REWARDS = { 1: 100, 2: 150, 3: 200, 4: 250, 5: 300, 6: 400, 7: 600 };
    const rewardCoins = STREAK_REWARDS[streak] || 100;
    const rewardXP = streak * 20;

    // Perform credit + record updates transactionally
    const conn = await getConnection();
    try {
      if (conn) await conn.beginTransaction();

      // 1. Credit wallet & XP
      await queryWithConnection(conn, 'UPDATE users SET coin_balance = coin_balance + ?, xp = xp + ? WHERE id = ?', [
        rewardCoins,
        rewardXP,
        userId
      ]);

      // fetch updated balance
      const updated = await queryWithConnection(conn, 'SELECT coin_balance FROM users WHERE id = ?', [userId]);
      const balanceAfter = updated && updated[0] ? updated[0].coin_balance : null;

      // 2. Insert/Update Daily Reward record
      await queryWithConnection(conn, 'INSERT INTO daily_rewards (user_id, streak_count, last_claimed_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE streak_count = VALUES(streak_count), last_claimed_at = VALUES(last_claimed_at)', [
        userId,
        streak,
        now
      ]);

      // 3. Insert transaction log (include balance_after)
      await queryWithConnection(conn, 'INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after) VALUES (?, ?, ?, ?, ?)', [
        userId,
        rewardCoins,
        'DAILY_REWARD',
        `🎁 Day ${streak} Login Bonus: 🪙 ${rewardCoins} Coins!`,
        balanceAfter
      ]);

      if (conn) await conn.commit();

      const updatedUsers = await query('SELECT coin_balance, xp, level FROM users WHERE id = ?', [userId]);

      return res.json({
        success: true,
        message: `🎉 Claimed Day ${streak} Daily Reward of 🪙 ${rewardCoins} FREE Virtual Coins!`,
        coinsAdded: rewardCoins,
        xpAdded: rewardXP,
        streak,
        newBalance: updatedUsers[0].coin_balance,
        user: updatedUsers[0]
      });
    } catch (innerErr) {
      if (conn) await conn.rollback();
      throw innerErr;
    } finally {
      if (conn) conn.release && conn.release();
    }
  } catch (err) {
    console.error('Claim Daily Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to claim daily reward.' });
  }
});

router.post('/spin-wheel', authenticateToken, async (req, res) => {
  return res.status(403).json({ success: false, message: 'The lucky spinner has been removed. Only a Master can provide virtual coins.' });
  const userId = req.user.id;
  const now = new Date();
  const cooldownStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const rewards = [100, 250, 500, 1000, 2500, 5000, 10000, 50000];

  try {
    const recentSpins = await query('SELECT spun_at FROM wheel_spins WHERE user_id = ? ORDER BY spun_at DESC LIMIT 1', [userId]);
    if (recentSpins.length > 0 && new Date(recentSpins[0].spun_at) > cooldownStart) {
      return res.status(429).json({ success: false, message: 'Your wheel is recharging. Come back after 24 hours.', nextSpinAt: new Date(new Date(recentSpins[0].spun_at).getTime() + 24 * 60 * 60 * 1000) });
    }

    const users = await query('SELECT coin_balance, xp, level, win_streak FROM users WHERE id = ?', [userId]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = users[0];
    const luck = Math.min(100, 25 + Number(user.level || 1) * 4 + Number(user.win_streak || 0) * 3 + Math.floor(Number(user.xp || 0) / 250));
    const roll = Math.random() * 100;
    const rewardIndex = roll < luck * 0.08 ? 7 : roll < luck * 0.2 ? 6 : roll < luck * 0.38 ? 5 : roll < 55 ? 4 : roll < 72 ? 3 : roll < 88 ? 2 : roll < 97 ? 1 : 0;
    const reward = rewards[rewardIndex];
    const conn = await getConnection();
    try {
      if (conn) await conn.beginTransaction();
      await queryWithConnection(conn, 'UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?', [reward, userId]);
      const updated = await queryWithConnection(conn, 'SELECT coin_balance FROM users WHERE id = ?', [userId]);
      const balanceAfter = updated[0].coin_balance;
      await queryWithConnection(conn, 'INSERT INTO wheel_spins (user_id, reward_amount, luck_score, spun_at) VALUES (?, ?, ?, ?)', [userId, reward, luck, now]);
      await queryWithConnection(conn, 'INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after) VALUES (?, ?, ?, ?, ?)', [userId, reward, 'WHEEL_SPIN', `Wheel spin reward: ${reward} virtual coins`, balanceAfter]);
      if (conn) await conn.commit();
      return res.json({ success: true, reward, luck, newBalance: balanceAfter, nextSpinAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) });
    } catch (innerErr) {
      if (conn) await conn.rollback();
      throw innerErr;
    } finally {
      if (conn) await conn.release();
    }
  } catch (err) {
    console.error('Wheel spin error:', err);
    return res.status(500).json({ success: false, message: 'Unable to spin the wheel right now.' });
  }
});

module.exports = router;
