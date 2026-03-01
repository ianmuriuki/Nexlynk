// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { supabaseAdmin } = require('../config/supabase');
const { safeAdd, emailQueue } = require('../jobs/queue');
const logger = require('../config/logger');

// ── helpers ──────────────────────────────────────────────

function issueTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, jti: uuidv4() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
}

// ── POST /auth/signup ─────────────────────────────────────

exports.signup = async (req, res, next) => {
  const { role, email, password, name } = req.body;

  try {
    // Check for existing user
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user row
    await query(
      'INSERT INTO users (id, role, email, password_hash) VALUES ($1, $2, $3, $4)',
      [userId, role, email, passwordHash]
    );

    // Create profile row
    if (role === 'student') {
      await query(
        'INSERT INTO student_profiles (id, name) VALUES ($1, $2)',
        [userId, name]
      );
    } else if (role === 'company') {
      await query(
        'INSERT INTO company_profiles (id, name) VALUES ($1, $2)',
        [userId, name]
      );
    }

    // Queue verification email
    await safeAdd(emailQueue, 'sendVerificationEmail', { userId, email, name });

    const { accessToken, refreshToken } = issueTokens(userId);
    await storeRefreshToken(userId, refreshToken);

    logger.info({ event: 'user_signup', userId, role, email });

    return res.status(201).json({
      message: 'Account created. Please verify your email.',
      accessToken,
      refreshToken,
      user: { id: userId, role, email, name },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/login ──────────────────────────────────────

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const { rows } = await query(
      'SELECT id, role, email, password_hash, is_email_verified FROM users WHERE email = $1',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const { accessToken, refreshToken } = issueTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);

    logger.info({ event: 'user_login', userId: user.id });

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, role: user.role, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/refresh ────────────────────────────────────

exports.refresh = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Bad Request', message: 'refreshToken required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, user_id FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
      [refreshToken]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }

    // Rotate: revoke old, issue new
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [refreshToken]);
    const { accessToken, refreshToken: newRefresh } = issueTokens(decoded.sub);
    await storeRefreshToken(decoded.sub, newRefresh);

    return res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }
    next(err);
  }
};

// ── POST /auth/logout ─────────────────────────────────────

exports.logout = async (req, res, next) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [refreshToken]);
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/forgot-password ────────────────────────────

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const { rows } = await query('SELECT id, email FROM users WHERE email = $1', [email]);
    // Always return 200 to prevent email enumeration
    if (rows.length) {
      await safeAdd(emailQueue,'sendPasswordResetEmail', { userId: rows[0].id, email });
    }
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};