// src/routes/files.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/files.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/cv/:key',   requireAuth, ctrl.getCVSignedUrl); // This endpoint is for students to get a signed URL to access their uploaded CV, and for admins to access any student's CV. The requireAuth middleware ensures that only authenticated users can access this endpoint, and the controller will handle the logic to check if the user has permission to access the requested CV based on their role and ownership.
router.get('/logo/:key', requireAuth, ctrl.getLogoSignedUrl); // This endpoint is for company admins to get a signed URL to access their uploaded logo, and for super admins to access any company's logo. The requireAuth middleware ensures that only authenticated users can access this endpoint, and the controller will handle the logic to check if the user has permission to access the requested logo based on their role and ownership.

module.exports = router;