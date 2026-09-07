const express = require('express');
const { query, getConnection, queryWithConnection } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireRoles } = require('../middleware/admin');

const router = express.Router();

async function recordAudit(req, action, targetType, targetId, details = {}) {
  await query(
    'INSERT INTO audit_logs (admin_user_id, admin_role, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, req.user.role, action, targetType, String(targetId || ''), JSON.stringify(details)]
  );
}

// Apply auth and admin middleware to all admin routes
router.use(authenticateToken, requireAdmin);

// 1. ADMIN DASHBOARD STATS
router.get('/stats', async (req, res) => {
  try {
    const users = await query('SELECT coin_balance, is_suspended FROM users');
    const predictions = await query('SELECT coins_staked, outcome FROM predictions');
    const matches = await query('SELECT status FROM matches');

    const totalUsers = users.length;
    const activeUsers = users.filter(u => !u.is_suspended).length;
    const totalPredictions = predictions.length;
    const totalCoinsInCirculation = users.reduce((sum, u) => sum + (u.coin_balance || 0), 0);
    const liveMatches = matches.filter(m => m.status === 'LIVE').length;
    const upcomingMatches = matches.filter(m => m.status === 'UPCOMING').length;
    const wins = predictions.filter(p => p.outcome === 'WON').length;
    const losses = predictions.filter(p => p.outcome === 'LOST').length;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalPredictions,
        totalCoinsInCirculation,
        liveMatches,
        upcomingMatches,
        wins,
        losses,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// 2. CREATE MATCH
router.post('/matches', async (req, res) => {
  try {
    const { sport, team_a_name, team_a_logo, team_b_name, team_b_logo, match_time, venue, league } = req.body;

    if (!sport || !team_a_name || !team_b_name || !match_time) {
      return res.status(400).json({ success: false, message: 'Sport, Team A, Team B, and Match Time are required.' });
    }

    const defaultLogos = {
      cricket: 'https://img.icons8.com/color/96/cricket.png',
      football: 'https://img.icons8.com/color/96/football.png',
      tennis: 'https://img.icons8.com/color/96/tennis-racket.png',
      basketball: 'https://img.icons8.com/color/96/basketball.png'
    };

    const logoA = team_a_logo || defaultLogos[sport] || defaultLogos.cricket;
    const logoB = team_b_logo || defaultLogos[sport] || defaultLogos.cricket;

    const result = await query(
      `INSERT INTO matches (sport, team_a_name, team_a_logo, team_b_name, team_b_logo, match_time, status, venue, league) 
       VALUES (?, ?, ?, ?, ?, ?, 'UPCOMING', ?, ?)`,
      [sport, team_a_name, logoA, team_b_name, logoB, new Date(match_time), venue || 'Stadium', league || 'Championship']
    );

    return res.status(201).json({
      success: true,
      message: 'Match created successfully.',
      matchId: result.insertId
    });
  } catch (err) {
    console.error('Create match error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create match.' });
  }
});

// 3. EDIT MATCH
router.put('/matches/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { sport, team_a_name, team_a_logo, team_b_name, team_b_logo, match_time, status, venue, league } = req.body;

    await query(
      `UPDATE matches SET sport = ?, team_a_name = ?, team_a_logo = ?, team_b_name = ?, team_b_logo = ?, 
       match_time = ?, status = ?, venue = ?, league = ? WHERE id = ?`,
      [sport, team_a_name, team_a_logo, team_b_name, team_b_logo, new Date(match_time), status, venue, league, matchId]
    );

    return res.json({ success: true, message: 'Match updated successfully.' });
  } catch (err) {
    console.error('Edit match error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update match.' });
  }
});

// 4. DELETE MATCH
router.delete('/matches/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    await query('DELETE FROM matches WHERE id = ?', [matchId]);
    return res.json({ success: true, message: 'Match deleted successfully.' });
  } catch (err) {
    console.error('Delete match error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete match.' });
  }
});

// 5. UPDATE DEMO LIVE SCORE & COMMENTARY
router.post('/matches/:id/live-update', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { status, score_team_a, score_team_b, match_minute, live_event_text } = req.body;

    if (status && !['UPCOMING', 'LIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Use Declare Winner to complete a match.' });
    }

    const matches = await query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (matches.length === 0) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const match = matches[0];
    let existingEvents = [];
    if (match.live_events_json) {
      existingEvents = typeof match.live_events_json === 'string' ? JSON.parse(match.live_events_json) : match.live_events_json;
    }

    if (live_event_text) {
      existingEvents.unshift({
        time: match_minute || 'LIVE',
        event: live_event_text
      });
    }

    await query(
      `UPDATE matches SET status = ?, score_team_a = ?, score_team_b = ?, match_minute = ?, live_events_json = ? WHERE id = ?`,
      [status || 'LIVE', score_team_a, score_team_b, match_minute, JSON.stringify(existingEvents), matchId]
    );

    return res.json({
      success: true,
      message: 'Live score updated successfully.',
      match_minute,
      score_team_a,
      score_team_b,
      events: existingEvents
    });
  } catch (err) {
    console.error('Live score update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update live score.' });
  }
});

// 6. DECLARE WINNER & SETTLE ALL PREDICTIONS
router.post('/matches/:id/declare-winner', async (req, res) => {
  try {
    const matchId = req.params.id;
    const { winner_team } = req.body;

    if (!winner_team) {
      return res.status(400).json({ success: false, message: 'Winning team name is required.' });
    }

    const matches = await query('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (matches.length === 0) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const match = matches[0];
    if (match.status === 'COMPLETED' || match.winner_team) {
      return res.status(409).json({ success: false, message: 'This match has already been settled.' });
    }
    const validWinner = [match.team_a_name, match.team_b_name].some(
      team => team.toLowerCase() === String(winner_team).trim().toLowerCase()
    );
    if (!validWinner) {
      return res.status(400).json({ success: false, message: 'Winner must be one of the match teams or players.' });
    }

    const conn = await getConnection();
    let predictions = [];
    let winnersCount = 0;
    let totalPayoutCoins = 0;
    try {
      if (conn) await conn.beginTransaction();

      // 1. Mark match COMPLETED & set winner
      await queryWithConnection(conn, 'UPDATE matches SET status = "COMPLETED", winner_team = ? WHERE id = ?', [winner_team, matchId]);

      // 2. Fetch all predictions on this match (lock rows when possible)
      predictions = await queryWithConnection(conn, 'SELECT * FROM predictions WHERE match_id = ?' + (conn ? ' FOR UPDATE' : ''), [matchId]);

      for (const pred of predictions) {
        if (pred.outcome !== 'PENDING') continue; // skip already settled

        if (pred.predicted_team.toLowerCase() === winner_team.toLowerCase()) {
          // WINNER!
          winnersCount++;
          const payout = pred.potential_reward;
          totalPayoutCoins += payout;

          // Mark prediction WON
          await queryWithConnection(conn, 'UPDATE predictions SET outcome = "WON" WHERE id = ?', [pred.id]);

          // Credit user wallet + award XP + update win streak
          await queryWithConnection(
            conn,
            'UPDATE users SET coin_balance = coin_balance + ?, xp = xp + 100, win_streak = win_streak + 1 WHERE id = ?',
            [payout, pred.user_id]
          );

          // Record transaction
          // record transaction with balance after
          const after = await queryWithConnection(conn, 'SELECT coin_balance FROM users WHERE id = ?', [pred.user_id]);
          const balanceAfterWin = after && after[0] ? after[0].coin_balance : null;
          await queryWithConnection(
            conn,
            'INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after) VALUES (?, ?, ?, ?, ?)',
            [
              pred.user_id,
              payout,
              'PREDICTION_WIN',
              `🎉 WON Prediction on ${winner_team}! Payout: 🪙 ${payout.toLocaleString()} virtual coins`,
              balanceAfterWin
            ]
          );
          await queryWithConnection(conn, 'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', [
            pred.user_id,
            'PREDICTION_WON',
            `Your prediction won. ${payout.toLocaleString()} virtual coins were added.`
          ]);
        } else {
          // LOST
          await queryWithConnection(conn, 'UPDATE predictions SET outcome = "LOST" WHERE id = ?', [pred.id]);
          await queryWithConnection(conn, 'UPDATE users SET win_streak = 0 WHERE id = ?', [pred.user_id]);
          await queryWithConnection(conn, 'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', [
            pred.user_id,
            'PREDICTION_LOST',
            `Your prediction on ${pred.predicted_team} was settled as lost.`
          ]);
        }
      }

      if (conn) await conn.commit();
    } catch (innerErr) {
      if (conn) await conn.rollback();
      throw innerErr;
    } finally {
      if (conn) conn.release && conn.release();
    }

    await recordAudit(req, 'SETTLE_MATCH', 'match', matchId, { winner_team, winnersCount, totalPayoutCoins });

    return res.json({
      success: true,
      message: `Match completed! Winner declared: ${winner_team}. Settled ${predictions.length} predictions (${winnersCount} winners, Total Payout: 🪙 ${totalPayoutCoins.toLocaleString()} coins).`,
      winnersCount,
      totalPayoutCoins
    });
  } catch (err) {
    console.error('Declare winner error:', err);
    return res.status(500).json({ success: false, message: 'Failed to declare winner and settle predictions.' });
  }
});

// 7. USER MANAGEMENT LIST & SEARCH
router.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    let users = await query('SELECT id, name, email, coin_balance, xp, level, role, is_admin, is_suspended, created_at FROM users ORDER BY id DESC');

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error('Admin users list error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// 8. TOGGLE USER SUSPENSION
router.post('/users/:id/toggle-suspend', async (req, res) => {
  try {
    const userId = req.params.id;
    const users = await query('SELECT is_suspended FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newStatus = users[0].is_suspended ? 0 : 1;
    await query('UPDATE users SET is_suspended = ? WHERE id = ?', [newStatus, userId]);

    return res.json({
      success: true,
      message: `User account has been ${newStatus ? 'suspended' : 'activated'}.`,
      is_suspended: newStatus
    });
  } catch (err) {
    console.error('Toggle suspend error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
});

// 9. ADJUST VIRTUAL COINS (ADMIN GRANT)
router.post('/users/:id/adjust-coins', async (req, res) => {
  try {
    const userId = req.params.id;
    const { amount, reason } = req.body;

    const coins = Number(amount);
    if (!Number.isSafeInteger(coins) || coins <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a positive whole-number coin grant.' });
    }

    const targetUsers = await query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!targetUsers.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const conn = await getConnection();
    try {
      if (conn) await conn.beginTransaction();

      await queryWithConnection(conn, 'UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?', [coins, userId]);

      // include balance_after
      const updatedUser = await queryWithConnection(conn, 'SELECT coin_balance FROM users WHERE id = ?', [userId]);
      const balanceAfter = updatedUser && updatedUser[0] ? updatedUser[0].coin_balance : null;
      await queryWithConnection(conn, 'INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after) VALUES (?, ?, ?, ?, ?)', [
        userId,
        coins,
        'ADMIN_ADJUSTMENT',
        `⚙️ Master Grant: ${reason || 'Support Grant'} (+${coins} 🪙)`,
        balanceAfter
      ]);

      if (conn) await conn.commit();
    } catch (innerErr) {
      if (conn) await conn.rollback();
      throw innerErr;
    } finally {
      if (conn) conn.release && conn.release();
    }

    return res.json({
      success: true,
      message: `Successfully granted +${coins} virtual coins.`
    });
  } catch (err) {
    console.error('Adjust coins error:', err);
    return res.status(500).json({ success: false, message: 'Failed to adjust coins.' });
  }
});

router.post('/masters', requireRoles('SUPER_MASTER'), async (req, res) => {
  try {
    const { userId, name, email, password, avatar } = req.body;
    let targetId = userId;
    if (targetId) {
      const users = await query('SELECT id, role FROM users WHERE id = ?', [targetId]);
      if (!users.length || users[0].role === 'SUPER_MASTER') {
        return res.status(400).json({ success: false, message: 'Only eligible USER accounts can become MASTER accounts.' });
      }
      await query('UPDATE users SET role = ?, is_admin = 1 WHERE id = ?', ['MASTER', targetId]);
    } else {
      if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Name, email, and a six-character password are required.' });
      }
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await query(
        'INSERT INTO users (name, email, password_hash, coin_balance, role, is_admin, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, passwordHash, 1000000, 'MASTER', 1, avatar || null]
      );
      targetId = result.insertId;
    }
    await recordAudit(req, 'CREATE_OR_PROMOTE_MASTER', 'user', targetId);
    return res.status(201).json({ success: true, message: 'MASTER account updated.', userId: targetId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Email is already registered.' });
    console.error('Master management error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to manage MASTER account.' });
  }
});

router.patch('/users/:id/role', requireRoles('SUPER_MASTER'), async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { role } = req.body;
    if (!Number.isInteger(targetId) || !['USER', 'MASTER'].includes(role) || targetId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Invalid role change.' });
    }
    const users = await query('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (!users.length || users[0].role === 'SUPER_MASTER') {
      return res.status(404).json({ success: false, message: 'That account cannot be changed.' });
    }
    await query('UPDATE users SET role = ?, is_admin = ? WHERE id = ?', [role, role === 'USER' ? 0 : 1, targetId]);
    await recordAudit(req, role === 'MASTER' ? 'PROMOTE_USER' : 'DEMOTE_MASTER', 'user', targetId, { role });
    return res.json({ success: true, role });
  } catch (err) {
    console.error('Role change error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to change account role.' });
  }
});

router.get('/audit', requireRoles('SUPER_MASTER'), async (req, res) => {
  try {
    const logs = await query('SELECT id, admin_user_id, admin_role, action, target_type, target_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    return res.json({ success: true, logs });
  } catch (err) {
    console.error('Audit fetch error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity.' });
  }
});

module.exports = router;
