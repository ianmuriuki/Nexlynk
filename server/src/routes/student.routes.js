// src/routes/student.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { requireAuth, requireRole, requireOwnership } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadCV } = require('../middleware/upload');
const { paginate } = require('../middleware/paginate');
const { updateProfileSchema } = require('../schemas/student.schema');
const { opportunityFilterSchema } = require('../schemas/company.schema');

router.get(
  '/:id/profile',
  requireAuth, requireOwnership,
  ctrl.getProfile
);

router.patch(
  '/:id/profile',
  requireAuth, requireOwnership,
  validate(updateProfileSchema),
  ctrl.updateProfile
);

router.post(
  '/:id/cv',
  requireAuth, requireOwnership,
  uploadCV,
  ctrl.uploadCV
);

// ── GET student applications — was missing ────────────────
router.get(
  '/:id/applications',
  requireAuth, requireOwnership,
  ctrl.getApplications
);

router.get(
  '/opportunities',
  requireAuth, requireRole('student'),
  paginate(),
  validate(opportunityFilterSchema, 'query'),
  ctrl.listOpportunities
);

router.post(
  '/opportunities/:id/apply',
  requireAuth, requireRole('student'),
  ctrl.applyToOpportunity
);

router.post('/opportunities/:id/view', requireAuth, requireRole('student'), ctrl.trackView);

module.exports = router;