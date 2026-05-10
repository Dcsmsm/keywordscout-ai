-- Cache for keyword search volumes fetched from DataForSEO.
-- Avoids redundant API calls for the same keyword/market combination.
-- TTL enforced in application logic (30 days).

CREATE TABLE public.keyword_volume_cache (
  keyword  text     NOT NULL,
  country  char(2)  NOT NULL,
  language char(2)  NOT NULL,
  volume   integer,
  cached_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (keyword, country, language)
);

CREATE INDEX keyword_volume_cache_cached_at_idx
  ON public.keyword_volume_cache (cached_at);
