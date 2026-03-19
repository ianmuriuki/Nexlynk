// src/routes/admin.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { paginate } = require('../middleware/paginate');

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard',                      ctrl.getDashboard);
router.get('/stats',                          ctrl.getStats);
router.get('/companies',       paginate(),    ctrl.listCompanies);
router.post('/companies/:id/approve',         ctrl.approveCompany);
router.post('/companies/:id/reject',          ctrl.rejectCompany);
router.get('/applications',    paginate(),    ctrl.listApplications);
router.put('/applications/:id/status',        ctrl.updateApplicationStatus);

module.exports = router;