// src/controllers/company.controller.js
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { supabaseAdmin } = require('../config/supabase');
const { paginationMeta } = require('../middleware/paginate');
const logger = require('../config/logger');

// ── POST /companies ───────────────────────────────────────

exports.registerCompany = async (req, res, next) => {
  const {
    email, password, name, industry, company_size,
    website, description, contact_name, contact_email, contact_phone,
  } = req.body;

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (id, role, email, password_hash) VALUES ($1, $2, $3, $4)',
      [userId, 'company', email, passwordHash]
    );

    const { rows } = await query(
      `INSERT INTO company_profiles
         (id, name, industry, company_size, website, description, contact_name, contact_email, contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [userId, name, industry, company_size, website, description, contact_name, contact_email, contact_phone]
    );

    logger.info({ event: 'company_registered', userId, name });

    return res.status(201).json({
      message: 'Company registered. Pending admin approval.',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /companies/:id ────────────────────────────────────

exports.getProfile = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT cp.*, u.email
       FROM company_profiles cp
       JOIN users u ON u.id = cp.id
       WHERE cp.id = $1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Company not found' });
    }
    return res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /companies/:id ──────────────────────────────────

exports.updateCompany = async (req, res, next) => {
  const fields = req.body;
  const allowed = [
    'name', 'industry', 'company_size', 'website',
    'description', 'contact_name', 'contact_email', 'contact_phone',
  ];

  const updates = Object.keys(fields).filter(k => allowed.includes(k));
  if (!updates.length) {
    return res.status(400).json({ error: 'Bad Request', message: 'No valid fields to update' });
  }

  try {
    const setClause = updates.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(k => fields[k])];

    const { rows } = await query(
      `UPDATE company_profiles SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Company not found' });
    }

    return res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /companies/:id/logo ──────────────────────────────

exports.uploadLogo = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Bad Request', message: 'Logo file is required' });
  }

  try {
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const fileKey = `logos/${req.params.id}/${uuidv4()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(process.env.STORAGE_BUCKET_LOGOS || 'logos')
      .upload(fileKey, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    await query(
      'UPDATE company_profiles SET logo_path = $1 WHERE id = $2',
      [fileKey, req.params.id]
    );

    logger.info({ event: 'logo_uploaded', companyId: req.params.id, fileKey });

    return res.json({ message: 'Logo uploaded successfully', logo_path: fileKey });
  } catch (err) {
    next(err);
  }
};

// ── POST /companies/:id/opportunities ────────────────────

exports.createOpportunity = async (req, res, next) => {
  const companyId = req.params.id;
  const {
    title, description, disciplines, skills_required,
    location, type, positions, duration, stipend,
    application_deadline, status,
  } = req.body;

  try {
    const { rows: company } = await query(
      "SELECT id FROM company_profiles WHERE id = $1 AND status = 'approved'",
      [companyId]
    );
    if (!company.length) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Company must be approved before posting opportunities',
      });
    }

    const { rows } = await query(
      `INSERT INTO opportunities
         (company_id, title, description, disciplines, skills_required,
          location, type, positions, duration, stipend, application_deadline, status)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        companyId, title, description,
        JSON.stringify(disciplines), JSON.stringify(skills_required),
        location, type, positions || 1, duration, stipend,
        application_deadline, status || 'draft',
      ]
    );

    logger.info({ event: 'opportunity_created', companyId, opportunityId: rows[0].id });

    return res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET /companies/:id/opportunities ─────────────────────

exports.getOpportunities = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT o.*,
         (SELECT COUNT(*) FROM applications a WHERE a.opportunity_id = o.id)::int AS application_count
       FROM opportunities o
       WHERE o.company_id = $1
       ORDER BY o.created_at DESC`,
      [req.params.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /companies/:id/applicants ─────────────────────────

exports.listApplicants = async (req, res, next) => {
  const { limit, offset, page } = req.pagination;
  const { opportunity_id, status } = req.query;

  try {
    const conditions = ['o.company_id = $1'];
    const values = [req.params.id];
    let idx = 2;

    if (opportunity_id) {
      conditions.push(`a.opportunity_id = $${idx}`);
      values.push(opportunity_id);
      idx++;
    }
    if (status) {
      conditions.push(`a.status = $${idx}`);
      values.push(status);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const { rows } = await query(
      `SELECT a.*,
         json_build_object(
           'name',               sp.name,
           'email',              u.email,
           'phone',              sp.phone,
           'university',         sp.university,
           'course',             sp.course,
           'year_of_study',      sp.year_of_study,
           'discipline',         sp.discipline,
           'skills',             sp.skills,
           'about',              sp.about,
           'cv_path',            sp.cv_path,
           'profile_completion', sp.profile_completion
         ) AS student,
         json_build_object(
           'id',    o.id,
           'title', o.title,
           'type',  o.type
         ) AS opportunity
       FROM applications a
       JOIN student_profiles sp ON sp.id = a.student_id
       JOIN users u              ON u.id  = a.student_id
       JOIN opportunities o      ON o.id  = a.opportunity_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return res.json({ data: rows, pagination: paginationMeta(total, { page, limit }) });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /companies/:id/applications/:appId/status ───────

exports.updateApplicationStatus = async (req, res, next) => {
  const { status } = req.body;
  const allowed = ['pending', 'shortlisted', 'placed', 'rejected'];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Status must be one of: ${allowed.join(', ')}`,
    });
  }

  try {
    const { rows } = await query(
      `UPDATE applications SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, req.params.appId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found' });
    }

    logger.info({ event: 'application_status_updated', appId: req.params.appId, status });
    return res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};