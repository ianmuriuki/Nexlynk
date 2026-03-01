// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const { query } = require('../config/db');

/**
 * Extracts Bearer token from Authorization header.
 */
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * requireAuth – verifies the JWT and attaches req.user.
 * Works with both Supabase Auth JWTs and custom JWTs.
 */
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  try {
    // Try Supabase Auth first
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (user && !error) {
      // Fetch role from our users table
      const { rows } = await query(
        'SELECT id, role, is_email_verified FROM users WHERE id = $1',
        [user.id]
      );
      if (!rows.length) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      }
      req.user = { id: user.id, email: user.email, ...rows[0] };
      return next();
    }

    // Fall back to custom JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, email, role, is_email_verified FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }
    req.user = rows[0];
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

/**
 * requireRole(...roles) – checks that req.user.role is in the allowed list.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
}

/**
 * requireOwnership – ensures req.user.id matches req.params.id
 * (or the user is an admin).
 */
function requireOwnership(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
  }
  next();
}

module.exports = { requireAuth, requireRole, requireOwnership };