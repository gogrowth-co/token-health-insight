
-- Table to cache token community data to reduce API calls
CREATE TABLE IF NOT EXISTS public.token_community_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id TEXT NOT NULL,
  twitter_handle TEXT NOT NULL,
  twitter_followers INTEGER,
  twitter_scan_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(token_id, twitter_handle)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_community_cache_token_id ON public.token_community_cache(token_id);
CREATE INDEX IF NOT EXISTS idx_token_community_cache_twitter_handle ON public.token_community_cache(twitter_handle);
