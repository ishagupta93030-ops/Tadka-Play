const express = require('express');
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const notifications = await query(
      'SELECT id, type, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unread = notifications.filter(notification => !notification.is_read).length;
    return res.json({ success: true, unread, notifications });
  } catch (err) {
    console.error('Notification fetch error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Notification read error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Notification read-all error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
});

module.exports = router;
