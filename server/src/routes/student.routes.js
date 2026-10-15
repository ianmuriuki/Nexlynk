// src/routes/student.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { requireAuth, requireOwnership } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadCV } = require('../middleware/upload');
const { updateProfileSchema } = require('../schemas/student.schema');

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

router.get(
  '/:id/applications',
  requireAuth, requireOwnership,
  ctrl.getApplications
);

module.exports = router;
