-- ============================================================
-- Migration 001: Initial Schema
-- Run: psql $DATABASE_URL -f migrations/001_initial_schema.sql
-- ============================================================

-- ── Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMs ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'company', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE company_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_status AS ENUM ('draft', 'published', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'pending', 'under_review', 'shortlisted', 'placed', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE placement_status AS ENUM (
    'active', 'completed', 'terminated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role              user_role NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  password_hash     TEXT,                          -- nullable when using Supabase Auth
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── STUDENT PROFILES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  id                    UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  phone                 TEXT,
  city                  TEXT,
  university            TEXT,
  course                TEXT,
  year_of_study         INTEGER CHECK (year_of_study BETWEEN 1 AND 10),
  expected_graduation   DATE,
  skills                JSONB NOT NULL DEFAULT '[]',
  discipline            TEXT,
  cv_path               TEXT,
  portfolio_links       TEXT[] DEFAULT '{}',
  availability          TEXT,
  about                 TEXT,
  profile_completion    INTEGER NOT NULL DEFAULT 0 CHECK (profile_completion BETWEEN 0 AND 100),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_discipline ON student_profiles (discipline);
CREATE INDEX IF NOT EXISTS idx_student_profiles_skills ON student_profiles USING GIN (skills);

-- ── COMPANY PROFILES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_profiles (
  id            UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  industry      TEXT,
  company_size  TEXT,
  website       TEXT,
  logo_path     TEXT,
  description   TEXT,
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status        company_status NOT NULL DEFAULT 'pending',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_profiles_status ON company_profiles (status);

-- ── OPPORTUNITIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES company_profiles (id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  disciplines           JSONB NOT NULL DEFAULT '[]',
  skills_required       JSONB NOT NULL DEFAULT '[]',
  location              TEXT,
  type                  TEXT,               -- internship | part-time | contract
  positions             INTEGER NOT NULL DEFAULT 1 CHECK (positions > 0),
  duration              TEXT,
  stipend               TEXT,
  application_deadline  DATE,
  status                opportunity_status NOT NULL DEFAULT 'draft',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status_deadline
  ON opportunities (status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id
  ON opportunities (company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_disciplines
  ON opportunities USING GIN (disciplines);
CREATE INDEX IF NOT EXISTS idx_opportunities_skills
  ON opportunities USING GIN (skills_required);

-- ── APPLICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
  status         application_status NOT NULL DEFAULT 'pending',
  applied_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note           TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, student_id)   -- prevents duplicate applications
);

CREATE INDEX IF NOT EXISTS idx_applications_student_id     ON applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status         ON applications (status);

-- ── PLACEMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS placements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
  company_id     UUID NOT NULL REFERENCES company_profiles (id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities (id) ON DELETE CASCADE,
  status         placement_status NOT NULL DEFAULT 'active',
  started_at     DATE,
  completed_at   DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placements_student_id  ON placements (student_id);
CREATE INDEX IF NOT EXISTS idx_placements_company_id  ON placements (company_id);
CREATE INDEX IF NOT EXISTS idx_placements_status      ON placements (status);

-- ── INVOICES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID NOT NULL REFERENCES placements (id) ON DELETE CASCADE,
  amount       NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  pdf_path     TEXT,
  paid         BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_placement_id ON invoices (placement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_paid         ON invoices (paid);

-- ── AUDIT / EVENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,   -- 'application' | 'company' | 'placement' | etc.
  entity_id   UUID NOT NULL,
  action      TEXT NOT NULL,   -- 'status_changed' | 'approved' | 'rejected' | etc.
  old_value   JSONB,
  new_value   JSONB,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_entity ON events (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_events_actor  ON events (actor_id);

-- ── REFRESH TOKENS (if not using Supabase Auth) ───────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens (token);

-- ── updated_at trigger function ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'student_profiles','company_profiles','opportunities',
    'applications','placements','invoices'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;