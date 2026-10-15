-- ============================================================
-- Migration 002: Sync schema with what is actually live
-- 001_initial_schema.sql is missing columns/tables that exist
-- in production. This migration is additive and idempotent,
-- safe to run against either the drifted live DB or a fresh one.
-- Run: psql $DATABASE_URL -f migrations/002_sync_live_schema.sql
-- ============================================================

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS cover_letter TEXT;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_email_verifications_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications (token);

CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_password_resets_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token);
