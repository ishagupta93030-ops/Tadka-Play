const express = require('express');
const { query } = require('../database/db');

const router = express.Router();

// GET ALL MATCHES WITH OPTIONAL FILTERS
router.get('/', async (req, res) => {
  try {
    const { sport, status, search } = req.query;
    let sql = 'SELECT * FROM matches';
    const params = [];
    const conditions = [];

    if (sport && sport !== 'all') {
      conditions.push('sport = ?');
      params.push(sport);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY match_time ASC';

    const matches = await query(sql, params);

    // Format matches with parsed live events
    const formatted = matches.map(m => ({
      ...m,
      live_events: m.live_events_json ? (typeof m.live_events_json === 'string' ? JSON.parse(m.live_events_json) : m.live_events_json) : []
    }));
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const searched = normalizedSearch
      ? formatted.filter(match => [match.team_a_name, match.team_b_name, match.league, match.venue].some(value => String(value || '').toLowerCase().includes(normalizedSearch)))
      : formatted;

    return res.json({
      success: true,
      count: searched.length,
      matches: searched
    });
  } catch (err) {
    console.error('Fetch Matches Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch matches.' });
  }
});

// GET MATCH DETAILS BY ID
router.get('/:id', async (req, res) => {
  try {
    const matchId = req.params.id;
    const matches = await query('SELECT * FROM matches WHERE id = ?', [matchId]);

    if (matches.length === 0) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const match = matches[0];
    const liveEvents = match.live_events_json ? (typeof match.live_events_json === 'string' ? JSON.parse(match.live_events_json) : match.live_events_json) : [];

    // Get predictions count on this match
    const preds = await query('SELECT predicted_team, coins_staked FROM predictions WHERE match_id = ?', [matchId]);
    const totalPredictionsCount = preds.length;
    let teamAPredictionCoins = 0;
    let teamBPredictionCoins = 0;

    preds.forEach(p => {
      if (p.predicted_team === match.team_a_name) teamAPredictionCoins += p.coins_staked;
      if (p.predicted_team === match.team_b_name) teamBPredictionCoins += p.coins_staked;
    });

    return res.json({
      success: true,
      match: {
        ...match,
        live_events: liveEvents,
        stats: {
          totalPredictions: totalPredictionsCount,
          teamACoinsStaked: teamAPredictionCoins,
          teamBCoinsStaked: teamBPredictionCoins
        }
      }
    });
  } catch (err) {
    console.error('Match Detail Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch match details.' });
  }
});

module.exports = router;
