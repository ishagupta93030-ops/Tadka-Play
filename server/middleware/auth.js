const jwt = require('jsonwebtoken');
const { jwtSecret: JWT_SECRET } = require('../config');
const { query } = require('../database/db');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }
    query('SELECT id, name, email, role, is_admin, is_suspended FROM users WHERE id = ?', [user.id])
      .then((rows) => {
        if (rows.length === 0 || rows[0].is_suspended) {
          return res.status(403).json({ success: false, message: 'Your session is no longer authorized.' });
        }
        const account = rows[0];
        req.user = {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role || (account.is_admin ? 'SUPER_MASTER' : 'USER'),
          is_admin: Boolean(account.is_admin)
        };
        next();
      })
      .catch(() => res.status(500).json({ success: false, message: 'Unable to validate session.' }));
  });
}

module.exports = { authenticateToken, JWT_SECRET };
