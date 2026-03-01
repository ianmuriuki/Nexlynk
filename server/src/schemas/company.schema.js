// src/schemas/company.schema.js
const Joi = require('joi');

const registerCompanySchema = Joi.object({
  email:         Joi.string().email().required(),
  password:      Joi.string().min(8).required(),
  name:          Joi.string().trim().min(2).max(200).required(),
  industry:      Joi.string().trim().max(100),
  company_size:  Joi.string().trim().max(50),
  website:       Joi.string().uri().allow(''),
  description:   Joi.string().trim().max(3000),
  contact_name:  Joi.string().trim().max(100),
  contact_email: Joi.string().email(),
  contact_phone: Joi.string().trim().max(20),
});

const updateCompanySchema = Joi.object({
  name:          Joi.string().trim().min(2).max(200),
  industry:      Joi.string().trim().max(100),
  company_size:  Joi.string().trim().max(50),
  website:       Joi.string().uri().allow(''),
  description:   Joi.string().trim().max(3000),
  contact_name:  Joi.string().trim().max(100),
  contact_email: Joi.string().email(),
  contact_phone: Joi.string().trim().max(20),
});

const createOpportunitySchema = Joi.object({
  title:                Joi.string().trim().min(3).max(200).required(),
  description:          Joi.string().trim().min(10).max(5000).required(),
  disciplines:          Joi.array().items(Joi.string().trim()).min(1).required(),
  skills_required:      Joi.array().items(Joi.string().trim()).min(1).required(),
  location:             Joi.string().trim().max(200),
  type:                 Joi.string().valid('internship', 'part-time', 'contract', 'full-time'),
  positions:            Joi.number().integer().min(1).max(500),
  duration:             Joi.string().trim().max(100),
  stipend:              Joi.string().trim().max(100).allow(''),
  application_deadline: Joi.string().isoDate(),
  status:               Joi.string().valid('draft', 'published'),
});

const opportunityFilterSchema = Joi.object({
  discipline: Joi.string().trim(),
  location:   Joi.string().trim(),
  type:       Joi.string().trim(),
  keyword:    Joi.string().trim().max(100),
  page:       Joi.number().integer().min(1),
  limit:      Joi.number().integer().min(1).max(100),
});

module.exports = {
  registerCompanySchema,
  updateCompanySchema,
  createOpportunitySchema,
  opportunityFilterSchema,
};