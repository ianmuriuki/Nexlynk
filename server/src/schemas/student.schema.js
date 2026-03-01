// src/schemas/student.schema.js
const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name:                Joi.string().trim().min(2).max(100),
  phone:               Joi.string().trim().max(20),
  city:                Joi.string().trim().max(100),
  university:          Joi.string().trim().max(200),
  course:              Joi.string().trim().max(200),
  year_of_study:       Joi.number().integer().min(1).max(10),
  expected_graduation: Joi.string().isoDate(),
  skills:              Joi.array().items(Joi.string().trim()).max(30),
  discipline:          Joi.string().trim().max(100),
  portfolio_links:     Joi.array().items(Joi.string().uri()).max(10),
  availability:        Joi.string().trim().max(200),
  about:               Joi.string().trim().max(2000),
});

module.exports = { updateProfileSchema };