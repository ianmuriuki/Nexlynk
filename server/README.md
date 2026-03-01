## Nexlynk — Backend Server

Node.js + Express + PostgreSQL (Supabase) REST API.

## Quick Start

```bash
cd server
cp .env.example .env        # fill in your values
npm install
node migrations/run.js      # run DB migrations
psql $DATABASE_URL -f seed/001_seed.sql   # optional seed data
npm run dev                 # start with nodemon
```

Start the email worker in a separate terminal:
```bash
node src/jobs/emailWorker.js
```

## Project Structure

```
server/
├── src/
│   ├── app.js               # Express app, middleware, route wiring
│   ├── server.js            # Entry point, DB check, listen
│   ├── config/
│   │   ├── db.js            # pg Pool
│   │   ├── supabase.js      # Supabase admin + anon clients
│   │   └── logger.js        # Winston logger
│   ├── middleware/
│   │   ├── auth.js          # requireAuth, requireRole, requireOwnership
│   │   ├── rateLimiter.js   # apiLimiter, authLimiter, forgotPasswordLimiter
│   │   ├── validate.js      # Joi validation wrapper
│   │   ├── upload.js        # Multer (CV + logo)
│   │   ├── paginate.js      # page/limit parsing
│   │   └── errorHandler.js  # notFound + global error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── company.routes.js
│   │   ├── admin.routes.js
│   │   └── files.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── company.controller.js
│   │   ├── admin.controller.js
│   │   └── files.controller.js
│   ├── schemas/
│   │   ├── auth.schema.js
│   │   ├── student.schema.js
│   │   └── company.schema.js
│   └── jobs/
│       ├── queue.js          # BullMQ queue instances
│       └── emailWorker.js    # Email worker process
├── migrations/
│   ├── 001_initial_schema.sql
│   └── run.js
├── seed/
│   └── 001_seed.sql
├── API_TESTING.sh            # cURL test commands for all endpoints
├── .env.example
└── package.json
```

## API Endpoints

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | /api/auth/signup | No | — |
| POST | /api/auth/login | No | — |
| POST | /api/auth/refresh | No | — |
| POST | /api/auth/logout | No | — |
| POST | /api/auth/forgot-password | No | — |
| GET | /api/students/:id/profile | Yes | owner/admin |
| PATCH | /api/students/:id/profile | Yes | owner/admin |
| POST | /api/students/:id/cv | Yes | owner |
| GET | /api/opportunities | Yes | student |
| POST | /api/opportunities/:id/apply | Yes | student |
| POST | /api/companies | No | — |
| PATCH | /api/companies/:id | Yes | owner/admin |
| POST | /api/companies/:id/logo | Yes | owner/admin |
| POST | /api/companies/:id/opportunities | Yes | company |
| GET | /api/companies/:id/applicants | Yes | owner/admin |
| GET | /api/admin/dashboard | Yes | admin |
| GET | /api/admin/companies | Yes | admin |
| POST | /api/admin/companies/:id/approve | Yes | admin |
| GET | /api/admin/applications | Yes | admin |
| PUT | /api/admin/applications/:id/status | Yes | admin |
| GET | /api/files/cv/:key | Yes | owner/company/admin |
| GET | /api/files/logo/:key | Yes | any |
| GET | /health | No | — |

## Database Schema

7 tables: `users`, `student_profiles`, `company_profiles`, `opportunities`, `applications`, `placements`, `invoices`, `events`, `refresh_tokens`

Run `migrations/001_initial_schema.sql` to create all tables, indexes, constraints, and triggers.

## Key Design Decisions

- **Auth**: Custom JWT (bcryptjs + jsonwebtoken) with Supabase Auth as an optional drop-in. Refresh token rotation is stored in `refresh_tokens` table.
- **File uploads**: `multer` buffers files in memory, then uploads to Supabase Storage with validated MIME types and size limits.
- **Duplicate applications**: `UNIQUE(opportunity_id, student_id)` constraint + application-level check returns 409 with existing ID.
- **Background jobs**: BullMQ + Redis. Email worker runs as a separate process for resilience.
- **Audit trail**: All status changes write to the `events` table with old/new values as JSONB.
- **Pagination**: All list endpoints support `?page=1&limit=20` via `paginate` middleware.