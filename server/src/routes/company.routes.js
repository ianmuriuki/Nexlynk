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

// Register company (public) to allow companies to create an account and profile before we have any company admins to create them manually.
router.post(
  '/',
  validate(registerCompanySchema),
  ctrl.registerCompany
);

// Update company profile for company admins (and super admins can update any company)
router.patch(
  '/:id',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  validate(updateCompanySchema),
  ctrl.updateCompany
);

// Upload logo for company admins (and super admins can upload for any company)
router.post(
  '/:id/logo',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  uploadLogo,
  ctrl.uploadLogo
);

// Create opportunity by adding to a company profile (only company admins can create opportunities for their own company)
router.post(
  '/:id/opportunities',
  requireAuth, requireRole('company'), requireOwnership,
  validate(createOpportunitySchema),
  ctrl.createOpportunity
);

// List applicants who have applied to a company's opportunities (only company admins can view applicants for their own company, but admins can view applicants for any company)
router.get(
  '/:id/applicants',
  requireAuth, requireRole('company', 'admin'), requireOwnership,
  paginate(),
  ctrl.listApplicants
);

module.exports = router;