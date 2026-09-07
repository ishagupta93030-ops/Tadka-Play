const express = require('express');
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET ALL ACHIEVEMENTS & LOGGED IN USER'S UNLOCKED BADGES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const allAchievements = await query('SELECT * FROM achievements');
    const userUnlocked = await query('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?', [
      userId
    ]);

    const unlockedMap = new Set(userUnlocked.map(u => u.achievement_id));

    const achievements = allAchievements.map(ach => ({
      ...ach,
      isUnlocked: unlockedMap.has(ach.id),
      unlockedAt: userUnlocked.find(u => u.achievement_id === ach.id)?.unlocked_at || null
    }));

    return res.json({
      success: true,
      achievements
    });
  } catch (err) {
    console.error('Achievements error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch achievements.' });
  }
});

module.exports = router;
