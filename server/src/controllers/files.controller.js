// src/controllers/files.controller.js
const { supabaseAdmin } = require('../config/supabase');
const { query } = require('../config/db');

const SIGNED_URL_EXPIRES = 60 * 60; // 1 hour for CVs and logos

// ── GET /files/cv/:key ────────────────────────────────────
// Issues a temporary signed URL for a private CV.

exports.getCVSignedUrl = async (req, res, next) => {
  const key = decodeURIComponent(req.params.key);

  try {
    // Verify the key belongs to the requesting user (unless admin)
    if (req.user.role !== 'admin') {
      const { rows } = await query(
        'SELECT id FROM student_profiles WHERE cv_path = $1 AND id = $2',
        [key, req.user.id]
      );
      // Companies viewing applicant CVs need access too
      if (!rows.length) {
        // Check if the requester is a company with an application for this student
        const { rows: appRows } = await query(
          `SELECT a.id FROM applications a
           JOIN opportunities o ON o.id = a.opportunity_id
           JOIN student_profiles sp ON sp.id = a.student_id
           WHERE sp.cv_path = $1 AND o.company_id = $2`,
          [key, req.user.id]
        );
        if (!appRows.length) {
          return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        }
      }
    }

    const { data, error } = await supabaseAdmin.storage
      .from(process.env.STORAGE_BUCKET_CVS || 'cvs')
      .createSignedUrl(key, SIGNED_URL_EXPIRES);

    if (error) throw error;

    return res.json({ signedUrl: data.signedUrl, expiresIn: SIGNED_URL_EXPIRES });
  } catch (err) {
    next(err);
  }
};

// ── GET /files/logo/:key ──────────────────────────────────

exports.getLogoSignedUrl = async (req, res, next) => {
  const key = decodeURIComponent(req.params.key);

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(process.env.STORAGE_BUCKET_LOGOS || 'logos')
      .createSignedUrl(key, SIGNED_URL_EXPIRES);

    if (error) throw error;

    return res.json({ signedUrl: data.signedUrl, expiresIn: SIGNED_URL_EXPIRES });
  } catch (err) {
    next(err);
  }
};