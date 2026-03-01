// src/routes/admin.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { paginate } = require('../middleware/paginate');

// All admin routes require auth + admin role to access anything in this router
router.use(requireAuth, requireRole('admin'));

router.get('/dashboard',                    ctrl.getDashboard);
router.get('/companies',        paginate(),  ctrl.listCompanies);
router.post('/companies/:id/approve',       ctrl.approveCompany);
router.get('/applications',     paginate(),  ctrl.listApplications);
router.put('/applications/:id/status',      ctrl.updateApplicationStatus);

module.exports = router;