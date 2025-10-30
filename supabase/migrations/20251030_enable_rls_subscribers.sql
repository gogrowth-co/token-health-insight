-- Enable RLS on subscribers table
-- This ensures users can only access their own subscription data

ALTER TABLE IF EXISTS subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscribers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own subscription data (scan count, etc.)
CREATE POLICY "Users can update own subscription"
  ON subscribers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all subscriptions (for webhooks and admin operations)
CREATE POLICY "Service role can manage all subscriptions"
  ON subscribers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow service role to insert subscriptions (for webhook events and new signups)
CREATE POLICY "Service role can insert subscriptions"
  ON subscribers FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add comment explaining the RLS policies
COMMENT ON TABLE subscribers IS 'Subscriber data with RLS enabled. Users can only access their own subscription. Service role has full access for webhooks and admin operations.';
