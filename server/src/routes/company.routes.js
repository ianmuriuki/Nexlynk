// src/routes/company.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/company.controller');
const { requireAuth, requireRole, requireOwnership } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadLogo } = require('../middleware/upload');
const { paginate } = require('../middleware/paginate');
const {
  registerCompanySchema,
  updateCompanySchema,
  createOpportunitySchema,
} = require('../schemas/company.schema');

// Register company (public)
router.post(
  '/',
  validate(registerCompanySchema),
  ctrl.registerCompany
);

// Get company profile
router.get(
  '/:id',
  requireAuth,
  ctrl.getProfile
);

// Update company profile
router.patch(
  '/:id',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  validate(updateCompanySchema),
  ctrl.updateCompany
);

// Upload logo
router.post(
  '/:id/logo',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  uploadLogo,
  ctrl.uploadLogo
);

// Create opportunity
router.post(
  '/:id/opportunities',
  requireAuth, requireRole('company'), requireOwnership,
  validate(createOpportunitySchema),
  ctrl.createOpportunity
);

// Get company opportunities
router.get(
  '/:id/opportunities',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  ctrl.getOpportunities
);

// List applicants
router.get(
  '/:id/applicants',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  paginate(),
  ctrl.listApplicants
);

// Update application status
router.patch(
  '/:id/applications/:appId/status',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  ctrl.updateApplicationStatus
);

module.exports = router;