-- seed/001_seed.sql
-- Development seed data
-- Run: psql $DATABASE_URL -f seed/001_seed.sql

-- Admin user (password: Admin1234!)
INSERT INTO users (id, role, email, password_hash, is_email_verified)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'admin',
  'admin@platform.dev',
  '$2b$10$YourHashedPasswordHere',  -- replace with real bcrypt hash
  TRUE
) ON CONFLICT DO NOTHING;

-- Demo company user
INSERT INTO users (id, role, email, password_hash, is_email_verified)
VALUES (
  'cccccccc-0000-0000-0000-000000000001',
  'company',
  'company@demo.dev',
  '$2b$10$YourHashedPasswordHere',
  TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO company_profiles (id, name, industry, company_size, description, contact_name, contact_email, status)
VALUES (
  'cccccccc-0000-0000-0000-000000000001',
  'Acme Corp',
  'Technology',
  '50-200',
  'A demo company for testing.',
  'Jane Smith',
  'jane@acme.demo',
  'approved'
) ON CONFLICT DO NOTHING;

-- Demo student user
INSERT INTO users (id, role, email, password_hash, is_email_verified)
VALUES (
  'ssssssss-0000-0000-0000-000000000001',
  'student',
  'student@demo.dev',
  '$2b$10$YourHashedPasswordHere',
  TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO student_profiles (id, name, university, course, year_of_study, discipline, skills, profile_completion)
VALUES (
  'ssssssss-0000-0000-0000-000000000001',
  'John Doe',
  'University of Nairobi',
  'Computer Science',
  3,
  'Software Engineering',
  '["JavaScript","Node.js","React"]',
  60
) ON CONFLICT DO NOTHING;

-- Sample opportunity
INSERT INTO opportunities (id, company_id, title, description, disciplines, skills_required, location, type, positions, status)
VALUES (
  'oooooooo-0000-0000-0000-000000000001',
  'cccccccc-0000-0000-0000-000000000001',
  'Junior Backend Developer Intern',
  'Work on our REST APIs and improve backend infrastructure.',
  '["Software Engineering","Computer Science"]',
  '["Node.js","PostgreSQL","REST APIs"]',
  'Nairobi',
  'internship',
  2,
  'published'
) ON CONFLICT DO NOTHING;