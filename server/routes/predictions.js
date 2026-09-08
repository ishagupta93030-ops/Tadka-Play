const express = require('express');
const { query, getConnection, queryWithConnection } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// SUBMIT PREDICTION
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { match_id, predicted_team, coins_staked } = req.body;

    const stake = Number(coins_staked);
    if (!Number.isSafeInteger(stake) || !match_id || !predicted_team || stake <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid prediction details.' });
    }

    // 1. Fetch user & check balance (inside a transaction to prevent races)
    const conn = await getConnection();
    try {
      if (conn) await conn.beginTransaction();

      const users = await queryWithConnection(conn, 'SELECT coin_balance, xp FROM users WHERE id = ?' + (conn ? ' FOR UPDATE' : ''), [userId]);
      if (users.length === 0) {
        if (conn) await conn.rollback();
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }

      const user = users[0];

    // 2. Fetch match & check status / deadline inside the same transaction.
    const matches = await queryWithConnection(conn, 'SELECT * FROM matches WHERE id = ?' + (conn ? ' FOR UPDATE' : ''), [match_id]);
    if (matches.length === 0) {
      if (conn) await conn.rollback();
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const match = matches[0];
    const predictionDeadline = match.prediction_deadline;
    if (match.status !== 'LIVE' || (predictionDeadline && new Date() >= new Date(predictionDeadline))) {
      if (conn) await conn.rollback();
      return res.status(400).json({ success: false, message: match.status === 'UPCOMING' ? 'This event has not started. Predictions open when the Master hosts the game.' : 'This event is already over. Predictions are closed.' });
    }

    if (user.coin_balance < stake) {
      if (conn) await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient virtual coins. Ask the Master to provide coins first. Your balance is 🪙 ${user.coin_balance.toLocaleString()}.`
      });
    }

    const validTeams = [match.team_a_name, match.team_b_name].map(team => team.toLowerCase());
    if (!validTeams.includes(String(predicted_team).trim().toLowerCase())) {
      if (conn) await conn.rollback();
      return res.status(400).json({ success: false, message: 'Choose one of the listed teams or players.' });
    }

    // Check existing prediction on this match by user
    const existing = await queryWithConnection(conn, 'SELECT id FROM predictions WHERE user_id = ? AND match_id = ?' + (conn ? ' FOR UPDATE' : ''), [userId, match_id]);
    if (existing.length > 0) {
      if (conn) await conn.rollback();
      return res.status(400).json({ success: false, message: 'You have already submitted a prediction for this match.' });
    }

    // Dynamic potential payout multiplier (e.g. 1.9x for classic 1v1 match)
    const multiplier = 1.9;
    const potentialReward = Math.round(stake * multiplier);

      // 3. Deduct coins from user wallet & award 20 XP for participation (ensure no negative balances)
      const updateRes = await queryWithConnection(
        conn,
        'UPDATE users SET coin_balance = coin_balance - ?, xp = xp + 20 WHERE id = ? AND coin_balance >= ?',
        [stake, userId, stake]
      );

      if (!updateRes || (updateRes.affectedRows !== undefined && updateRes.affectedRows === 0)) {
        if (conn) await conn.rollback();
        return res.status(400).json({ success: false, message: 'Insufficient virtual coins.' });
      }

      // 4. Save prediction record
      const result = await queryWithConnection(
        conn,
        'INSERT INTO predictions (user_id, match_id, predicted_team, coins_staked, potential_reward, outcome) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, match_id, predicted_team, stake, potentialReward, 'PENDING']
      );

      // 5. Record transaction history (include balance after)
      const post = await queryWithConnection(conn, 'SELECT coin_balance FROM users WHERE id = ?', [userId]);
      const balanceAfterStake = post && post[0] ? post[0].coin_balance : null;
      await queryWithConnection(
        conn,
        'INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after) VALUES (?, ?, ?, ?, ?)',
        [userId, -stake, 'PREDICTION_STAKE', `🎯 Placed prediction on ${predicted_team} (${match.team_a_name} vs ${match.team_b_name})`, balanceAfterStake]
      );
      await queryWithConnection(conn, 'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', [
        userId,
        'PREDICTION_PLACED',
        `Prediction placed on ${predicted_team}. ${stake.toLocaleString()} virtual coins used.`
      ]);

      if (conn) await conn.commit();

      // Fetch updated balance (use normal query after commit to reflect persisted state)
      const updatedUsers = await query('SELECT coin_balance, xp, level FROM users WHERE id = ?', [userId]);
      const updatedUser = updatedUsers[0];

      return res.json({
        success: true,
        message: `Prediction confirmed! Used 🪙 ${stake.toLocaleString()} virtual coins on ${predicted_team}. Potential Reward: 🪙 ${potentialReward.toLocaleString()} coins.`,
        predictionId: result.insertId,
        newBalance: updatedUser.coin_balance,
        xpGained: 20,
        user: updatedUser
      });
    } catch (innerErr) {
      if (conn) await conn.rollback();
      throw innerErr;
    } finally {
      if (conn) conn.release && conn.release();
    }
  } catch (err) {
    console.error('Submit Prediction Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit prediction.' });
  }
});

// GET USER'S PREDICTION HISTORY
router.get('/my-predictions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const predictions = await query('SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const matches = await query('SELECT * FROM matches');

    // Enrich predictions with coins won/lost summary (calculated server-side)
    const enriched = predictions.map(p => {
      const match = matches.find(item => item.id === p.match_id) || {};
      let coinsWon = 0;
      let coinsLost = 0;
      if (p.outcome === 'WON') {
        coinsWon = p.potential_reward || 0;
      } else if (p.outcome === 'LOST') {
        coinsLost = p.coins_staked || 0;
      }
      return {
        ...p,
        sport: match.sport,
        team_a_name: match.team_a_name,
        team_b_name: match.team_b_name,
        league: match.league,
        match_status: match.status,
        winner_team: match.winner_team,
        coinsWon,
        coinsLost,
        coinsChange: coinsWon - coinsLost
      };
    });

    return res.json({
      success: true,
      count: enriched.length,
      predictions: enriched
    });
  } catch (err) {
    console.error('Prediction history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch prediction history.' });
  }
});

module.exports = router;
