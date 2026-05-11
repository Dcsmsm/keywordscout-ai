-- ─────────────────────────────────────────────────────────────────
-- 005_difficulty_serp_cache.sql
-- competition column on volume cache + keyword_difficulty_cache
-- + keyword_serp_cache for selective real-SERP enrichment
-- ─────────────────────────────────────────────────────────────────

-- Add Google Ads competition (0–1) to existing volume cache
ALTER TABLE public.keyword_volume_cache
  ADD COLUMN IF NOT EXISTS competition numeric(5,4);

-- SEO keyword difficulty from DataForSEO Labs (bulk endpoint, 30-day TTL)
CREATE TABLE IF NOT EXISTS public.keyword_difficulty_cache (
  keyword    text     NOT NULL,
  country    char(2)  NOT NULL,
  language   char(2)  NOT NULL,
  difficulty smallint CHECK (difficulty BETWEEN 0 AND 100),
  cached_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (keyword, country, language)
);

CREATE INDEX IF NOT EXISTS idx_keyword_difficulty_cache_cached_at
  ON public.keyword_difficulty_cache (cached_at);

ALTER TABLE public.keyword_difficulty_cache ENABLE ROW LEVEL SECURITY;

-- Full SERP results JSON for top-N keywords (14-day TTL)
CREATE TABLE IF NOT EXISTS public.keyword_serp_cache (
  keyword    text     NOT NULL,
  country    char(2)  NOT NULL,
  language   char(2)  NOT NULL,
  serp_data  jsonb    NOT NULL,
  cached_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (keyword, country, language)
);

CREATE INDEX IF NOT EXISTS idx_keyword_serp_cache_cached_at
  ON public.keyword_serp_cache (cached_at);

ALTER TABLE public.keyword_serp_cache ENABLE ROW LEVEL SECURITY;

-- Both tables accessed exclusively via service-role admin client (bypasses RLS)
