// src/app.js
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { apiLimiter }       = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes    = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const companyRoutes = require('./routes/company.routes');
const adminRoutes   = require('./routes/admin.routes');
const filesRoutes   = require('./routes/files.routes');

const app = express();

//  Security and CORS middleware to set HTTP headers and enable CORS for allowed origins (e.g., frontend app)
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
}));

// ── Logging for development and production (combined format for production, dev format for development) 
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing for JSON and URL-encoded data with size limits to prevent abuse (e.g., 1mb) 
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Global rate limit for all API routes to prevent abuse and DDoS attacks (e.g., 100 requests per 15 minutes)
app.use('/api', apiLimiter);

// ── Health check for monitoring and uptime checks (e.g., by load balancers or uptime monitoring services)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── API routes for authentication, students, companies, admin dashboard, and file access (e.g., CVs and logos). Each route module will handle its own sub-routes and apply necessary middleware for authentication and authorization.
app.use('/api/auth',        authRoutes);
app.use('/api/students',    studentRoutes);
app.use('/api/companies',   companyRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/files',       filesRoutes);

// ── Opportunities route alias (brief: GET /opportunities) ─
// Re-export the student list endpoint at the top-level too
app.get('/api/opportunities', require('./middleware/auth').requireAuth, require('./middleware/paginate').paginate(), require('./controllers/student.controller').listOpportunities);
app.post('/api/opportunities/:id/apply', require('./middleware/auth').requireAuth, require('./middleware/auth').requireRole('student'), require('./controllers/student.controller').applyToOpportunity);

// ── 404 & Error Handling for any routes that are not defined or if any errors occur in the route handlers. The notFound middleware will catch any requests to undefined routes and return a 404 response, while the errorHandler middleware will catch any errors thrown in the route handlers and return a structured error response with appropriate status codes and messages.
app.use(notFound);
app.use(errorHandler);

module.exports = app;