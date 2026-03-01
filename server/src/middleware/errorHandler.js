// src/middleware/errorHandler.js
const logger = require('../config/logger');

// 404 handler — call after all routes
function notFound(req, res) {
  res.status(404).json({ error: 'Not Found', message: `${req.method} ${req.path} not found` });
}

// Global error handler — must have 4 params for Express to treat it as error middleware
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    user: req.user?.id,
  });

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Conflict', message: 'Resource already exists' });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Bad Request', message: 'Referenced resource not found' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal Server Error';

  res.status(status).json({ error: status < 500 ? 'Error' : 'Internal Server Error', message });
}

module.exports = { notFound, errorHandler };