-- Enable RLS on all cache tables
-- Cache tables should be readable by all authenticated and anonymous users
-- But only writable by service role (edge functions)

-- 1. token_metrics_cache
ALTER TABLE IF EXISTS token_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token metrics cache"
  ON token_metrics_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token metrics cache"
  ON token_metrics_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. token_data_cache
ALTER TABLE IF EXISTS token_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token data cache"
  ON token_data_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token data cache"
  ON token_data_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. token_search_cache
ALTER TABLE IF EXISTS token_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token search cache"
  ON token_search_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token search cache"
  ON token_search_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. token_holders_cache
ALTER TABLE IF EXISTS token_holders_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token holders cache"
  ON token_holders_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token holders cache"
  ON token_holders_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. token_community_cache
ALTER TABLE IF EXISTS token_community_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token community cache"
  ON token_community_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token community cache"
  ON token_community_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. token_security_cache
ALTER TABLE IF EXISTS token_security_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token security cache"
  ON token_security_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token security cache"
  ON token_security_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. token_liquidity_cache
ALTER TABLE IF EXISTS token_liquidity_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token liquidity cache"
  ON token_liquidity_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token liquidity cache"
  ON token_liquidity_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. token_tokenomics_cache
ALTER TABLE IF EXISTS token_tokenomics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token tokenomics cache"
  ON token_tokenomics_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token tokenomics cache"
  ON token_tokenomics_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. token_development_cache
ALTER TABLE IF EXISTS token_development_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read token development cache"
  ON token_development_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage token development cache"
  ON token_development_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. social_metrics_cache
ALTER TABLE IF EXISTS social_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read social metrics cache"
  ON social_metrics_cache FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage social metrics cache"
  ON social_metrics_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments explaining the RLS policies
COMMENT ON TABLE token_metrics_cache IS 'Public cache table with RLS. Readable by all, writable by service role only.';
COMMENT ON TABLE token_data_cache IS 'Public cache table with RLS. Readable by all, writable by service role only.';
COMMENT ON TABLE token_search_cache IS 'Public cache table with RLS. Readable by all, writable by service role only.';
COMMENT ON TABLE token_holders_cache IS 'Public cache table with RLS. Readable by all, writable by service role only.';
COMMENT ON TABLE token_community_cache IS 'Public cache table with RLS. Readable by all, writable by service role only.';
COMMENT ON TABLE social_metrics_cache IS 'Public cache table with RLS. Readable by all, writable by service role only.';
