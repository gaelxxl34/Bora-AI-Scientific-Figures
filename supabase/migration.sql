-- ============================================================
-- Bora AI Scientific Figure — Supabase Migration Script
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates all tables, types, RLS policies, and triggers.
-- ============================================================

-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom types
-- ============================================================
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'lab');

-- 3. Profiles table (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'user',
  plan        user_plan NOT NULL DEFAULT 'free',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- 4. Projects table
-- ============================================================
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Untitled Project',
  is_shared   BOOLEAN NOT NULL DEFAULT false,
  lab_id      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- 5. Figures table
-- ============================================================
CREATE TABLE figures (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'Untitled Figure',
  canvas_json   JSONB,
  svg_content   TEXT,
  thumbnail_url TEXT,
  is_public     BOOLEAN NOT NULL DEFAULT false,
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_figures_project_id ON figures(project_id);
CREATE INDEX idx_figures_user_id ON figures(user_id);

-- 6. Generation logs table
-- ============================================================
CREATE TABLE generation_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  figure_id         UUID REFERENCES figures(id) ON DELETE SET NULL,
  model             TEXT,
  prompt_text       TEXT,
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  latency_ms        INTEGER,
  icon_ids_used     TEXT[] DEFAULT '{}',
  user_rating       SMALLINT CHECK (user_rating BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);

-- 7. Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_figures_updated_at
  BEFORE UPDATE ON figures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 10. Row Level Security (RLS)
-- ============================================================

-- Helper: check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Profiles ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (but not role/plan)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Super admins can update any profile (including role/plan)
CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_super_admin());

-- ── Projects ──
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (is_admin());

-- ── Figures ──
ALTER TABLE figures ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own figures
CREATE POLICY "Users can view own figures"
  ON figures FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create figures"
  ON figures FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own figures"
  ON figures FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own figures"
  ON figures FOR DELETE
  USING (user_id = auth.uid());

-- Anyone can view public figures
CREATE POLICY "Public figures are viewable by all"
  ON figures FOR SELECT
  USING (is_public = true);

-- Admins can view all figures
CREATE POLICY "Admins can view all figures"
  ON figures FOR SELECT
  USING (is_admin());

-- ── Generation Logs ──
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON generation_logs FOR SELECT
  USING (user_id = auth.uid());

-- Users can create logs (from AI calls)
CREATE POLICY "Users can create logs"
  ON generation_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all logs
CREATE POLICY "Admins can view all logs"
  ON generation_logs FOR SELECT
  USING (is_admin());

-- ── Icons ──
-- Icons are stored locally in bora-web/public/icons/ (not in DB)

-- 11. Storage bucket for figure exports (optional)
-- ============================================================
-- Run this manually in the Supabase Dashboard → Storage → Create bucket:
--   Bucket name: figure-exports
--   Public: No
--
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('figure-exports', 'figure-exports', false);

-- ============================================================
-- DONE! Your Supabase database is ready.
-- ============================================================
