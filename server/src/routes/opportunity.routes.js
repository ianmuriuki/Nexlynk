// src/routes/opportunity.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { paginate } = require('../middleware/paginate');
const { opportunityFilterSchema } = require('../schemas/company.schema');

// Public browsing — no account required
router.get(
  '/',
  paginate(),
  validate(opportunityFilterSchema, 'query'),
  ctrl.listOpportunities
);

// Public single listing — no account required
router.get(
  '/:id',
  ctrl.getOpportunity
);

// Requires a student account to apply
router.post(
  '/:id/apply',
  requireAuth, requireRole('student'),
  ctrl.applyToOpportunity
);

// Public view tracking
router.post(
  '/:id/view',
  ctrl.trackView
);

module.exports = router;
