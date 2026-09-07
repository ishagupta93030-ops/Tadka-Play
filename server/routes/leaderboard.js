const express = require('express');
const { query } = require('../database/db');

const router = express.Router();

// GET LEADERBOARD (WEEKLY, MONTHLY, OR ALL-TIME)
router.get('/', async (req, res) => {
  try {
    const timeframe = ['weekly', 'monthly', 'all-time'].includes(req.query.timeframe)
      ? req.query.timeframe
      : 'all-time';

    const users = await query('SELECT id, name, coin_balance, xp, level, win_streak, avatar FROM users');

    // Compute win stats for top users
    const predictions = await query('SELECT user_id, outcome, created_at FROM predictions');
    const transactions = await query('SELECT user_id, amount, created_at FROM coin_transactions');
    const now = Date.now();
    const periodStart = timeframe === 'weekly'
      ? now - (7 * 24 * 60 * 60 * 1000)
      : timeframe === 'monthly'
        ? now - (30 * 24 * 60 * 60 * 1000)
        : 0;

    const scoredUsers = users.map(user => {
      const userPredictions = predictions.filter(prediction => prediction.user_id === user.id && new Date(prediction.created_at).getTime() >= periodStart);
      const userTransactions = transactions.filter(transaction => transaction.user_id === user.id && new Date(transaction.created_at).getTime() >= periodStart);
      const won = userPredictions.filter(prediction => prediction.outcome === 'WON').length;
      const score = timeframe === 'all-time'
        ? user.coin_balance
        : userTransactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
      const winRate = userPredictions.length > 0 ? Math.round((won / userPredictions.length) * 100) : 0;
      return { user, userPredictions, score, won, winRate };
    }).sort((a, b) => b.score - a.score || b.won - a.won);

    const leaderboard = scoredUsers.slice(0, 50).map(({ user: u, userPredictions, score, won, winRate }, index) => {
      return {
        rank: index + 1,
        id: u.id,
        name: u.name,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        coin_balance: u.coin_balance,
        score,
        wins: won,
        predictions: userPredictions.length,
        xp: u.xp,
        level: u.level,
        win_streak: u.win_streak,
        winRate
      };
    });

    return res.json({
      success: true,
      timeframe: timeframe || 'all-time',
      leaderboard
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load leaderboard.' });
  }
});

module.exports = router;
