-- ============================================================
-- Her Madness — Migration 002
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pwuayyyqonocvuozycek/sql
-- ============================================================

-- 1. Tournament results table (stores actual game winners for scoring)
CREATE TABLE IF NOT EXISTS tournament_results (
  id       SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  picks    JSONB    NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with one empty row
INSERT INTO tournament_results (id, picks) VALUES (1, '{}')
ON CONFLICT DO NOTHING;

-- Public read (everyone can see results for display)
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "results_public_read" ON tournament_results;
CREATE POLICY "results_public_read" ON tournament_results
  FOR SELECT USING (true);

-- 2. Brackets RLS — users can only edit before lock + submission
-- NOTE: If RLS is already enabled, the CREATE POLICY calls may error.
-- Run DROP POLICY IF EXISTS first if needed.

ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brackets_own_select"       ON brackets;
DROP POLICY IF EXISTS "brackets_own_insert"       ON brackets;
DROP POLICY IF EXISTS "brackets_update_before_lock" ON brackets;

-- Users see their own bracket
CREATE POLICY "brackets_own_select" ON brackets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their bracket
CREATE POLICY "brackets_own_insert" ON brackets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update ONLY before submission AND before lock time
-- Lock time: March 20 2026 11:00 AM EDT = 15:00 UTC
CREATE POLICY "brackets_update_before_lock" ON brackets
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND submitted_at IS NULL
    AND now() < '2026-03-20T15:00:00Z'::timestamptz
  );
