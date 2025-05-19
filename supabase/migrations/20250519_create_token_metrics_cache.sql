
-- Create token_metrics_cache table to store metrics data for tokens
CREATE TABLE IF NOT EXISTS public.token_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT UNIQUE NOT NULL,
  metrics JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index on token_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_metrics_cache_token_id ON public.token_metrics_cache (token_id);

-- Create social_metrics_cache table to track social media metrics
CREATE TABLE IF NOT EXISTS public.social_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle TEXT UNIQUE NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  previous_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index on twitter_handle for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_metrics_cache_handle ON public.social_metrics_cache (twitter_handle);
