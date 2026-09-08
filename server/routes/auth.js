const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// REGISTER USER
router.post('/register', async (req, res) => {
  try {
    const { name, password, confirmPassword } = req.body;
    const emailAddress = String(req.body.email || '').trim().toLowerCase();

    if (!name || !emailAddress || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check duplicate
    const existing = await query('SELECT id FROM users WHERE email = ?', [emailAddress]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password securely with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const STARTING_COINS = 0;

    // Create User
    const result = await query(
      'INSERT INTO users (name, email, password_hash, coin_balance, xp, level) VALUES (?, ?, ?, ?, 0, 1)',
      [name, emailAddress, passwordHash, STARTING_COINS]
    );

    const userId = result.insertId;

    // Generate Token
    const userPayload = { id: userId };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Your Master can provide virtual coins when you are ready to play.',
      token,
      user: {
        id: userId,
        name,
        email: emailAddress,
        coin_balance: STARTING_COINS,
        xp: 0,
        level: 1,
        win_streak: 0,
        is_admin: 0,
        role: 'USER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const emailAddress = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!emailAddress || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [emailAddress]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    if (user.is_suspended) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Token payload
    const tokenPayload = {
      id: user.id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Welcome back to TadkaPlay!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        coin_balance: user.coin_balance,
        xp: user.xp,
        level: user.level,
        win_streak: user.win_streak,
        is_admin: user.is_admin,
        role: user.role || (user.is_admin ? 'SUPER_MASTER' : 'USER'),
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// GET CURRENT USER PROFILE & STATS
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    // Compute stats
    const predictions = await query('SELECT * FROM predictions WHERE user_id = ?', [user.id]);
    const transactions = await query('SELECT amount FROM coin_transactions WHERE user_id = ?', [user.id]);
    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.outcome === 'WON').length;
    const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
    const totalCoinsEarned = transactions.filter(transaction => transaction.amount > 0).reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const totalCoinsUsed = transactions.filter(transaction => transaction.amount < 0).reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        coin_balance: user.coin_balance,
        xp: user.xp,
        level: user.level,
        win_streak: user.win_streak,
        is_admin: user.is_admin,
        role: user.role || (user.is_admin ? 'SUPER_MASTER' : 'USER'),
        avatar: user.avatar,
        stats: {
          totalPredictions,
          correctPredictions,
          accuracy
          ,totalCoinsEarned
          ,totalCoinsUsed
          ,wins: correctPredictions
          ,losses: predictions.filter(prediction => prediction.outcome === 'LOST').length
        }
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : null;
    const avatar = typeof req.body.avatar === 'string' ? req.body.avatar.trim() : null;
    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'Display name must be between 2 and 100 characters.' });
    }
    if (avatar && avatar.length > 500) {
      return res.status(400).json({ success: false, message: 'Avatar URL is too long.' });
    }
    await query('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [name, avatar || null, req.user.id]);
    const users = await query('SELECT id, name, email, coin_balance, xp, level, win_streak, is_admin, role, avatar FROM users WHERE id = ?', [req.user.id]);
    return res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('Profile update error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
