-- Enable RLS on token_scans table
-- This ensures users can only access their own token scan history

ALTER TABLE IF EXISTS token_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own scans
CREATE POLICY "Users can view own scans"
  ON token_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own scans
CREATE POLICY "Users can insert own scans"
  ON token_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own scans (for scan history management)
CREATE POLICY "Users can delete own scans"
  ON token_scans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all scans (for admin operations and analytics)
CREATE POLICY "Service role can manage all scans"
  ON token_scans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment explaining the RLS policies
COMMENT ON TABLE token_scans IS 'Token scan history with RLS enabled. Users can only access their own scan records. Service role has full access for analytics and admin operations.';
