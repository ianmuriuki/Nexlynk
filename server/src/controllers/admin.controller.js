// src/controllers/admin.controller.js
const { query } = require('../config/db');
const { safeAdd, emailQueue } = require('../jobs/queue');
const logger = require('../config/logger');
const { paginationMeta } = require('../middleware/paginate');

// ── GET /admin/dashboard ──────────────────────────────────

exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalCompanies,
      pendingCompanies,
      totalOpportunities,
      totalApplications,
      totalPlacements,
      applicationsByStatus,
      recentApplications,
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      query("SELECT COUNT(*) FROM company_profiles"),
      query("SELECT COUNT(*) FROM company_profiles WHERE status = 'pending'"),
      query("SELECT COUNT(*) FROM opportunities WHERE status = 'published'"),
      query("SELECT COUNT(*) FROM applications"),
      query("SELECT COUNT(*) FROM placements"),
      query(`
        SELECT status, COUNT(*) AS count
        FROM applications
        GROUP BY status
      `),
      query(`
        SELECT a.id, a.status, a.applied_at,
               sp.name AS student_name,
               o.title AS opportunity_title,
               cp.name AS company_name
        FROM applications a
        JOIN student_profiles sp ON sp.id = a.student_id
        JOIN opportunities o     ON o.id  = a.opportunity_id
        JOIN company_profiles cp ON cp.id = o.company_id
        ORDER BY a.applied_at DESC
        LIMIT 10
      `),
    ]);

    // Flatten applicationsByStatus into named fields the client expects
    const statusMap = {};
    applicationsByStatus.rows.forEach(r => {
      statusMap[r.status] = parseInt(r.count, 10);
    });

    return res.json({
      data: {
        // Top-level counts
        students:                parseInt(totalStudents.rows[0].count,    10),
        companies:               parseInt(totalCompanies.rows[0].count,   10),
        pending_companies:       parseInt(pendingCompanies.rows[0].count, 10),
        opportunities:           parseInt(totalOpportunities.rows[0].count, 10),
        applications:            parseInt(totalApplications.rows[0].count,  10),
        placements:              parseInt(totalPlacements.rows[0].count,    10),
        // Breakdown by status
        pending_applications:    statusMap['pending']     ?? 0,
        shortlisted_applications:statusMap['shortlisted'] ?? 0,
        placed_applications:     statusMap['placed']      ?? 0,
        rejected_applications:   statusMap['rejected']    ?? 0,
        // Recent activity
        recent_applications:     recentApplications.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /admin/companies ──────────────────────────────────

exports.listCompanies = async (req, res, next) => {
  const { status } = req.query;
  const { limit, offset, page } = req.pagination;

  try {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) {
      conditions.push(`cp.status = $${idx}`);
      values.push(status);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM company_profiles cp ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const { rows } = await query(
      `SELECT
         cp.*,
         u.email,
         u.created_at AS registered_at,
         (SELECT COUNT(*) FROM opportunities o
          WHERE o.company_id = cp.id)::int                                AS opportunity_count,
         (SELECT COUNT(*) FROM applications a
          JOIN opportunities o ON o.id = a.opportunity_id
          WHERE o.company_id = cp.id)::int                                AS application_count,
         (SELECT COUNT(*) FROM placements p
          WHERE p.company_id = cp.id)::int                                AS placement_count
       FROM company_profiles cp
       JOIN users u ON u.id = cp.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return res.json({ data: rows, pagination: paginationMeta(total, { page, limit }) });
  } catch (err) {
    next(err);
  }
};

// ── POST /admin/companies/:id/approve ─────────────────────

exports.approveCompany = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows: before } = await query(
      'SELECT status FROM company_profiles WHERE id = $1',
      [id]
    );
    if (!before.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Company not found' });
    }

    const { rows } = await query(
      "UPDATE company_profiles SET status = 'approved' WHERE id = $1 RETURNING *",
      [id]
    );

    const { rows: user } = await query('SELECT email FROM users WHERE id = $1', [id]);

    await query(
      `INSERT INTO events (actor_id, entity_type, entity_id, action, old_value, new_value)
       VALUES ($1, 'company', $2, 'approved', $3::jsonb, $4::jsonb)`,
      [req.user.id, id,
       JSON.stringify({ status: before[0].status }),
       JSON.stringify({ status: 'approved' })]
    );

    await safeAdd(emailQueue, 'sendCompanyApprovedEmail', {
      companyId: id,
      email: user[0].email,
      companyName: rows[0].name,
    });

    logger.info({ event: 'company_approved', adminId: req.user.id, companyId: id });

    return res.json({ message: 'Company approved', data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /admin/companies/:id/reject ──────────────────────

exports.rejectCompany = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows: before } = await query(
      'SELECT status FROM company_profiles WHERE id = $1',
      [id]
    );
    if (!before.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Company not found' });
    }

    const { rows } = await query(
      "UPDATE company_profiles SET status = 'rejected' WHERE id = $1 RETURNING *",
      [id]
    );

    await query(
      `INSERT INTO events (actor_id, entity_type, entity_id, action, old_value, new_value)
       VALUES ($1, 'company', $2, 'rejected', $3::jsonb, $4::jsonb)`,
      [req.user.id, id,
       JSON.stringify({ status: before[0].status }),
       JSON.stringify({ status: 'rejected' })]
    );

    // Get company email for notification
    const { rows: user } = await query('SELECT email FROM users WHERE id = $1', [id]);
    if (user.length) {
      await safeAdd(emailQueue, 'sendCompanyRejectedEmail', {
        email: user[0].email,
        companyName: rows[0].name,
      });
    }

    logger.info({ event: 'company_rejected', adminId: req.user.id, companyId: id });

    return res.json({ message: 'Company rejected', data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PUT /admin/applications/:id/status ────────────────────

exports.updateApplicationStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses = ['pending', 'shortlisted', 'placed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const { rows: before } = await query(
      'SELECT status, student_id, opportunity_id FROM applications WHERE id = $1',
      [id]
    );
    if (!before.length) {
      return res.status(404).json({ error: 'Not Found', message: 'Application not found' });
    }

    const { rows } = await query(
      'UPDATE applications SET status = $1, updated_at = NOW(), note = COALESCE($2, note) WHERE id = $3 RETURNING *',
      [status, note, id]
    );

    await query(
      `INSERT INTO events (actor_id, entity_type, entity_id, action, old_value, new_value)
       VALUES ($1, 'application', $2, 'status_changed', $3::jsonb, $4::jsonb)`,
      [req.user.id, id,
       JSON.stringify({ status: before[0].status }),
       JSON.stringify({ status })]
    );



    const { rows: student } = await query(
  'SELECT u.email, sp.name FROM users u JOIN student_profiles sp ON sp.id = u.id WHERE u.id = $1',
  [before[0].student_id]
);
const { rows: appDetails } = await query(
  `SELECT o.title AS opportunity_title, cp.name AS company_name
   FROM applications a
   JOIN opportunities o ON o.id = a.opportunity_id
   JOIN company_profiles cp ON cp.id = o.company_id
   WHERE a.id = $1`,
  [id]
);
if (student.length) {
  await safeAdd(emailQueue, 'sendApplicationStatusEmail', {
    email:            student[0].email,
    studentName:      student[0].name,
    newStatus:        status,
    applicationId:    id,
    opportunityTitle: appDetails[0]?.opportunity_title || '',
    companyName:      appDetails[0]?.company_name      || '',
  });
}

    if (status === 'placed') {
      const { rows: opp } = await query(
        'SELECT company_id FROM opportunities WHERE id = $1',
        [before[0].opportunity_id]
      );
      if (opp.length) {
        await query(
          `INSERT INTO placements (student_id, company_id, opportunity_id)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [before[0].student_id, opp[0].company_id, before[0].opportunity_id]
        );
      }
    }

    logger.info({
      event: 'application_status_changed',
      adminId: req.user.id,
      applicationId: id,
      from: before[0].status,
      to: status,
    });

    return res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET /admin/applications ───────────────────────────────

exports.listApplications = async (req, res, next) => {
  const { status, company_id } = req.query;
  const { limit, offset, page } = req.pagination;

  try {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status)     { conditions.push(`a.status = $${idx}`);      values.push(status);     idx++; }
    if (company_id) { conditions.push(`o.company_id = $${idx}`);  values.push(company_id); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const { rows } = await query(
      `SELECT
         a.*,
         sp.name        AS student_name,
         sp.university  AS student_university,
         sp.discipline  AS student_discipline,
         o.title        AS opportunity_title,
         cp.name        AS company_name
       FROM applications a
       JOIN student_profiles sp ON sp.id = a.student_id
       JOIN opportunities o     ON o.id  = a.opportunity_id
       JOIN company_profiles cp ON cp.id = o.company_id
       ${where}
       ORDER BY a.applied_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    return res.json({ data: rows, pagination: paginationMeta(total, { page, limit }) });
  } catch (err) {
    next(err);
  }
};

// ── GET /admin/stats?period=day|week|month|3months|6months|year ──

exports.getStats = async (req, res, next) => {
  const { period = '6months' } = req.query;

  // Map period to SQL interval and grouping
  const periodMap = {
    day:      { interval: '1 day',    trunc: 'hour',  format: 'HH24:00' },
    week:     { interval: '7 days',   trunc: 'day',   format: 'Mon DD'  },
    month:    { interval: '30 days',  trunc: 'day',   format: 'Mon DD'  },
    '3months':{ interval: '90 days',  trunc: 'week',  format: 'Mon DD'  },
    '6months':{ interval: '180 days', trunc: 'month', format: 'Mon YYYY'},
    year:     { interval: '365 days', trunc: 'month', format: 'Mon YYYY'},
  };

  const cfg = periodMap[period] || periodMap['6months'];

  try {
    const { rows: applications } = await query(
      `SELECT
         date_trunc('${cfg.trunc}', applied_at) AS period,
         COUNT(*) AS applications,
         COUNT(*) FILTER (WHERE status = 'placed') AS placements,
         COUNT(*) FILTER (WHERE status = 'shortlisted') AS shortlisted,
         COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
       FROM applications
       WHERE applied_at >= NOW() - INTERVAL '${cfg.interval}'
       GROUP BY date_trunc('${cfg.trunc}', applied_at)
       ORDER BY period ASC`
    );

    return res.json({
      data: applications.map(r => ({
        period:       r.period,
        applications: parseInt(r.applications, 10),
        placements:   parseInt(r.placements,   10),
        shortlisted:  parseInt(r.shortlisted,  10),
        rejected:     parseInt(r.rejected,     10),
      })),
    });
  } catch (err) {
    next(err);
  }
};