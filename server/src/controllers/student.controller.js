// src/controllers/student.controller.js
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { supabaseAdmin } = require('../config/supabase');
const { paginationMeta } = require('../middleware/paginate');
const logger = require('../config/logger');

// ── GET /students/:id/profile ─────────────────────────────

exports.getProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT sp.*, u.email, u.is_email_verified
       FROM student_profiles sp
       JOIN users u ON u.id = sp.id
       WHERE sp.id = $1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Student profile not found' });
    }
    return res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /students/:id/profile ───────────────────────────

exports.updateProfile = async (req, res, next) => {
  const fields = req.body;
  const allowed = [
    'name', 'phone', 'city', 'university', 'course',
    'year_of_study', 'expected_graduation', 'skills',
    'discipline', 'portfolio_links', 'availability', 'about',
  ];

  const updates = Object.keys(fields).filter(k => allowed.includes(k));
  if (!updates.length) {
    return res.status(400).json({ error: 'Bad Request', message: 'No valid fields to update' });
  }

  try {
    const setClause = updates.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(k => {
      const v = fields[k];
      return Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : v;
    })];

    const { rows } = await query(
      `UPDATE student_profiles SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
    }

    const profile = rows[0];
    const completionFields = [
      'name', 'phone', 'city', 'university', 'course',
      'year_of_study', 'expected_graduation', 'discipline', 'about',
    ];
    const filled = completionFields.filter(f => profile[f]).length;
    const completion = Math.round((filled / completionFields.length) * 100);

    const { rows: updated } = await query(
      'UPDATE student_profiles SET profile_completion = $1 WHERE id = $2 RETURNING *',
      [completion, req.params.id]
    );

    return res.json({ data: updated[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /students/:id/cv ─────────────────────────────────

exports.uploadCV = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Bad Request', message: 'CV file is required' });
  }

  try {
    const fileKey = `cvs/${req.params.id}/${uuidv4()}.pdf`;
    const { error } = await supabaseAdmin.storage
      .from(process.env.STORAGE_BUCKET_CVS || 'cvs')
      .upload(fileKey, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) throw error;

    await query(
      'UPDATE student_profiles SET cv_path = $1 WHERE id = $2',
      [fileKey, req.params.id]
    );

    logger.info({ event: 'cv_uploaded', studentId: req.params.id, fileKey });

    return res.json({ message: 'CV uploaded successfully', cv_path: fileKey });
  } catch (err) {
    next(err);
  }
};

// ── GET /students/:id/applications ───────────────────────

exports.getApplications = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         a.*,
         json_build_object(
           'id',           o.id,
           'title',        o.title,
           'type',         o.type,
           'location',     o.location,
           'stipend',      o.stipend,
           'application_deadline', o.application_deadline,
           'company_name', cp.name
         ) AS opportunity
       FROM applications a
       JOIN opportunities o      ON o.id  = a.opportunity_id
       JOIN company_profiles cp  ON cp.id = o.company_id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /opportunities ────────────────────────────────────

exports.listOpportunities = async (req, res, next) => {
  const { discipline, location, type, keyword } = req.query;
  const { limit, offset, page } = req.pagination;

  try {
    const conditions = ["o.status = 'published'"];
    const values = [];
    let idx = 1;

    if (discipline) {
      conditions.push(`o.disciplines @> $${idx}::jsonb`);
      values.push(JSON.stringify([discipline]));
      idx++;
    }
    if (location) {
      conditions.push(`o.location ILIKE $${idx}`);
      values.push(`%${location}%`);
      idx++;
    }
    if (type) {
      conditions.push(`o.type = $${idx}`);
      values.push(type);
      idx++;
    }
    if (keyword) {
      conditions.push(`(o.title ILIKE $${idx} OR o.description ILIKE $${idx})`);
      values.push(`%${keyword}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM opportunities o ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const { rows } = await query(
      `SELECT o.*, cp.name AS company_name, cp.logo_path AS company_logo
       FROM opportunities o
       JOIN company_profiles cp ON cp.id = o.company_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return res.json({
      data: rows,
      pagination: paginationMeta(total, { page, limit }),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /opportunities/:id/apply ─────────────────────────

exports.applyToOpportunity = async (req, res, next) => {
  const studentId = req.user.id;
  const opportunityId = req.params.id;

  try {
    const { rows: opp } = await query(
      "SELECT id FROM opportunities WHERE id = $1 AND status = 'published'",
      [opportunityId]
    );
    if (!opp.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Opportunity not found or closed' });
    }

    const { rows: existing } = await query(
      'SELECT id FROM applications WHERE opportunity_id = $1 AND student_id = $2',
      [opportunityId, studentId]
    );
    if (existing.length) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'You have already applied to this opportunity',
        applicationId: existing[0].id,
      });
    }

    const { rows } = await query(
      `INSERT INTO applications (opportunity_id, student_id)
       VALUES ($1, $2) RETURNING *`,
      [opportunityId, studentId]
    );

    logger.info({ event: 'application_submitted', studentId, opportunityId });

    return res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};