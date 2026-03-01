// src/schemas/auth.schema.js
const Joi = require('joi');

const signupSchema = Joi.object({
  role:     Joi.string().valid('student', 'company').required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required()
    .messages({ 'string.min': 'Password must be at least 8 characters' }),
  name:     Joi.string().trim().min(2).max(100).required(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token:    Joi.string().required(),
  password: Joi.string().min(8).required(),
});

module.exports = { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };