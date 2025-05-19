
-- Create token_search_cache table
CREATE TABLE IF NOT EXISTS public.token_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT UNIQUE NOT NULL,
  results JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index on the query field for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_search_cache_query ON public.token_search_cache (query);
