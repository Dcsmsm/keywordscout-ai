-- ─────────────────────────────────────────────────────────────────
-- 004_keyword_expansion.sql
-- Autocomplete cache + keyword_results source/relevance columns
-- ─────────────────────────────────────────────────────────────────

-- Autocomplete suggestions cache (7-day TTL, deduplicated at upsert)
CREATE TABLE IF NOT EXISTS public.autocomplete_cache (
  query      text         NOT NULL,
  language   char(2)      NOT NULL,
  country    char(2)      NOT NULL,
  suggestions jsonb        NOT NULL DEFAULT '[]',
  cached_at  timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (query, language, country)
);

-- keyword_analyses: store mining params
ALTER TABLE public.keyword_analyses
  ADD COLUMN IF NOT EXISTS language   text,
  ADD COLUMN IF NOT EXISTS country    char(2),
  ADD COLUMN IF NOT EXISTS mining_depth smallint DEFAULT 2;

-- keyword_results: provenance + expansion metadata
ALTER TABLE public.keyword_results
  ADD COLUMN IF NOT EXISTS keyword_source text
    CHECK (keyword_source IN ('autocomplete','autocomplete_modifier','paa','related','claude','seed')),
  ADD COLUMN IF NOT EXISTS relevance_score numeric(4,3),
  ADD COLUMN IF NOT EXISTS source_modifier text;

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_autocomplete_cache_lookup
  ON public.autocomplete_cache (query, language, country);

-- RLS: autocomplete_cache is internal-only (service role bypasses RLS)
ALTER TABLE public.autocomplete_cache ENABLE ROW LEVEL SECURITY;
-- No user-facing policies needed — accessed exclusively via admin client
