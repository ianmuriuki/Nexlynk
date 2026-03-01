// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
} = require('../schemas/auth.schema');

router.post('/signup',          authLimiter, validate(signupSchema),          ctrl.signup);
router.post('/login',           authLimiter, validate(loginSchema),           ctrl.login);
router.post('/refresh',         authLimiter,                                  ctrl.refresh);
router.post('/logout',                                                         ctrl.logout);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword);

module.exports = router;