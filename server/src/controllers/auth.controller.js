// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { supabaseAdmin } = require('../config/supabase');
const { safeAdd, emailQueue } = require('../jobs/queue');
const logger = require('../config/logger');

// ── helpers ──────────────────────────────────────────────

function issueTokens(userId, role, email) {
  const payload = { sub: userId, role, email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign(
    { ...payload, jti: uuidv4() }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
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

// Generate a secure random token and store it against the user
async function createVerificationToken(userId) {
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await query(
    `INSERT INTO email_verifications (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET token = $2, expires_at = $3, used = FALSE`,
    [userId, token, expiresAt]
  );
  return token;
}

// ── POST /auth/signup ─────────────────────────────────────

exports.signup = async (req, res, next) => {
  const { role, email, password, name } = req.body;

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (id, role, email, password_hash) VALUES ($1, $2, $3, $4)',
      [userId, role, email, passwordHash]
    );

    if (role === 'student') {
      await query('INSERT INTO student_profiles (id, name) VALUES ($1, $2)', [userId, name]);
    } else if (role === 'company') {
      await query('INSERT INTO company_profiles (id, name) VALUES ($1, $2)', [userId, name]);
    }

    // Generate verification token
    const verificationToken = await createVerificationToken(userId);

    // Queue verification email
    await safeAdd(emailQueue, 'sendVerificationEmail', {
      userId, email, name, token: verificationToken,
    });

    // Queue company registration pending email
    if (role === 'company') {
      await safeAdd(emailQueue, 'sendCompanyRegisteredEmail', {
        email, companyName: name,
      });
    }

    const { accessToken, refreshToken } = issueTokens(userId, role, email);
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

    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const { accessToken, refreshToken } = issueTokens(user.id, user.role, user.email);
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

// ── GET /auth/verify?token=xxx ────────────────────────────

exports.verifyEmail = async (req, res, next) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Bad Request', message: 'Token is required' });
  }

  try {
    const { rows } = await query(
      `SELECT user_id FROM email_verifications
       WHERE token = $1 AND expires_at > NOW() AND used = FALSE`,
      [token]
    );

    if (!rows.length) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or expired verification link. Please request a new one.',
      });
    }

    const userId = rows[0].user_id;

    // Mark user as verified
    await query('UPDATE users SET is_email_verified = TRUE WHERE id = $1', [userId]);

    // Mark token as used
    await query('UPDATE email_verifications SET used = TRUE WHERE token = $1', [token]);

    logger.info({ event: 'email_verified', userId });

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/resend-verification ────────────────────────

exports.resendVerification = async (req, res, next) => {
  const { email } = req.body;
  try {
    const { rows } = await query(
      'SELECT id, is_email_verified FROM users WHERE email = $1',
      [email]
    );
    // Always return 200 to prevent email enumeration
    if (rows.length && !rows[0].is_email_verified) {
      const token = await createVerificationToken(rows[0].id);
      await safeAdd(emailQueue, 'sendVerificationEmail', { email, token });
    }
    return res.json({ message: 'If your email exists and is unverified, a new link has been sent.' });
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
      'SELECT id FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
      [refreshToken]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }

    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [refreshToken]);

    const { rows: userRows } = await query(
      'SELECT id, role, email FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (!userRows.length) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }
    const user = userRows[0];

    const { accessToken, refreshToken: newRefresh } = issueTokens(user.id, user.role, user.email);
    await storeRefreshToken(user.id, newRefresh);

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
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length) {
      // Generate a secure reset token valid for 1 hour
      const token     = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await query(
        `INSERT INTO password_resets (user_id, token, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, used = FALSE`,
        [rows[0].id, token, expiresAt]
      );
      await safeAdd(emailQueue, 'sendPasswordResetEmail', { email, token });
    }
    // Always 200 to prevent email enumeration
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/reset-password ─────────────────────────────

exports.resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Bad Request', message: 'token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 8 characters' });
  }

  try {
    const { rows } = await query(
      `SELECT user_id FROM password_resets
       WHERE token = $1 AND expires_at > NOW() AND used = FALSE`,
      [token]
    );
    if (!rows.length) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or expired reset link. Please request a new one.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, rows[0].user_id]);
    await query('UPDATE password_resets SET used = TRUE WHERE token = $1', [token]);

    // Revoke all existing refresh tokens for security
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [rows[0].user_id]);

    logger.info({ event: 'password_reset', userId: rows[0].user_id });
    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};