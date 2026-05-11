-- ─────────────────────────────────────────────────────────────────
-- 006_data_quality_flags.sql
-- Track whether difficulty/SERP scores are real or estimated
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.keyword_results
  ADD COLUMN IF NOT EXISTS has_real_difficulty boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_real_serp       boolean NOT NULL DEFAULT false;

-- Backfill seed keywords (keyword_source = 'seed') as having real data
UPDATE public.keyword_results
  SET has_real_serp = true, has_real_difficulty = true
  WHERE keyword_source = 'seed';
