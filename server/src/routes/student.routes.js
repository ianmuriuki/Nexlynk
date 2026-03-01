// src/routes/student.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { requireAuth, requireRole, requireOwnership } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadCV } = require('../middleware/upload');
const { paginate } = require('../middleware/paginate');
const { updateProfileSchema } = require('../schemas/student.schema');
const { opportunityFilterSchema } = require('../schemas/company.schema');

// Profile CRUD operations
router.get(
  '/:id/profile',
  requireAuth, requireOwnership, // means students can only access their own profile, but admins can access any student's profile
  ctrl.getProfile // ctrl.getProfile is designed to allow students to view their own profile, and admins to view any student's profile.
);

router.patch(
  '/:id/profile',
  requireAuth, requireOwnership,
  validate(updateProfileSchema),
  ctrl.updateProfile
);

// CV Upload (also serves as a test endpoint for file uploads)
router.post(
  '/:id/cv',
  requireAuth, requireOwnership,
  uploadCV,
  ctrl.uploadCV
);

// Opportunities (public browse — auth optional, but we require it here for apply)
router.get(
  '/opportunities',
  requireAuth, requireRole('student'),
  paginate(),
  validate(opportunityFilterSchema, 'query'),
  ctrl.listOpportunities
);

// Apply to an opportunity (only students can apply, and they can only apply to published opportunities)
router.post(
  '/opportunities/:id/apply',
  requireAuth, requireRole('student'),
  ctrl.applyToOpportunity
);

module.exports = router;