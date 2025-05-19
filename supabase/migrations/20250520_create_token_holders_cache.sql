
-- Table to cache token holders data to reduce API calls
CREATE TABLE IF NOT EXISTS public.token_holders_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_address TEXT NOT NULL UNIQUE,
  percentage TEXT NOT NULL,
  value FLOAT NOT NULL,
  trend TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to create the token_holders_cache table if it doesn't exist
CREATE OR REPLACE FUNCTION create_token_holders_cache_table() 
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.token_holders_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT NOT NULL UNIQUE,
    percentage TEXT NOT NULL,
    value FLOAT NOT NULL,
    trend TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
