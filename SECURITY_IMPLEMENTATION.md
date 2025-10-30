# Security Implementation Guide

This document explains the security implementations and decisions made for the Token Health Insight application.

## Table of Contents

1. [JWT Verification Configuration](#jwt-verification-configuration)
2. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
3. [CORS Configuration](#cors-configuration)
4. [Error Handling](#error-handling)
5. [Protected Scan Middleware](#protected-scan-middleware)
6. [Best Practices](#best-practices)

---

## JWT Verification Configuration

### Current Configuration

```toml
[functions.get-token-metrics]
verify_jwt = false
```

### Why JWT Verification is Disabled

The `get-token-metrics` edge function has JWT verification disabled for the following reasons:

1. **Public Token Search**: The application allows unauthenticated users to search and view token information before signing up
2. **User Experience**: Requiring authentication for basic token lookups would create friction in the user funnel
3. **Caching Strategy**: Most data is cached in public cache tables that don't contain sensitive user information

### Security Measures in Place

Despite JWT verification being disabled for this endpoint, the following security measures protect the system:

1. **Rate Limiting** (TO BE IMPLEMENTED):
   - IP-based rate limiting for anonymous users
   - Higher limits for authenticated users
   - Progressive backoff for repeated requests

2. **RLS Policies**:
   - Cache tables have read-only access for anonymous users
   - Only service role can write to cache tables
   - User-specific tables (subscribers, profiles, token_scans) are fully protected

3. **Data Access Control**:
   - No sensitive user data is exposed through public endpoints
   - User-specific operations (subscription checks, scan history) require JWT authentication

4. **CORS Restrictions**:
   - Origin validation limits which domains can call the functions
   - Prevents CSRF attacks and unauthorized access

### Authenticated Endpoints

The following endpoints **require JWT authentication**:

- `check-subscription`: ✅ JWT Required
- `create-checkout`: ✅ JWT Required
- `customer-portal`: ✅ JWT Required
- `stripe-webhook`: ✅ Signature Verification
- `get-token-info`: ❌ Public (with rate limiting)
- `get-token-metrics`: ❌ Public (with rate limiting)
- `search-tokens`: ❌ Public (with rate limiting)

---

## Row Level Security (RLS) Policies

All database tables now have RLS enabled with the following policies:

### User-Specific Tables

#### subscribers
```sql
-- Users can only view/update their own subscription
POLICY "Users can view own subscription" FOR SELECT USING (auth.uid() = user_id)
POLICY "Users can update own subscription" FOR UPDATE USING (auth.uid() = user_id)

-- Service role has full access (for webhooks)
POLICY "Service role can manage all subscriptions" FOR ALL TO service_role
```

#### profiles
```sql
-- Users can only view/update their own profile
POLICY "Users can view own profile" FOR SELECT USING (auth.uid() = id)
POLICY "Users can update own profile" FOR UPDATE USING (auth.uid() = id)
```

#### token_scans
```sql
-- Users can only view their own scan history
POLICY "Users can view own scans" FOR SELECT USING (auth.uid() = user_id)
POLICY "Users can insert own scans" FOR INSERT WITH CHECK (auth.uid() = user_id)
```

### Public Cache Tables

All cache tables follow this pattern:

```sql
-- Anyone (authenticated or anonymous) can read
POLICY "Anyone can read [table_name]" FOR SELECT TO authenticated, anon USING (true)

-- Only service role can write
POLICY "Service role can manage [table_name]" FOR ALL TO service_role
```

**Cache Tables**:
- `token_metrics_cache`
- `token_data_cache`
- `token_search_cache`
- `token_holders_cache`
- `token_community_cache`
- `token_security_cache`
- `token_liquidity_cache`
- `token_tokenomics_cache`
- `token_development_cache`
- `social_metrics_cache`

---

## CORS Configuration

### Origin Validation

CORS headers are now validated against an allowlist:

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173', // Vite
  // Production domains (to be added)
];

export const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};
```

### Usage in Edge Functions

Updated functions use the new `getCorsHeaders()` function:

```typescript
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ... function logic
});
```

### Updating CORS for Production

Before deploying to production:

1. Update `ALLOWED_ORIGINS` in `/supabase/functions/_shared/cors.ts`
2. Add your production domain(s):
   ```typescript
   const ALLOWED_ORIGINS = [
     'http://localhost:8080',
     'http://localhost:3000',
     'https://yourdomain.com',
     'https://app.yourdomain.com',
   ];
   ```
3. Redeploy all edge functions

---

## Error Handling

### Secure Error Responses

All edge functions now use the `createErrorResponse` utility to prevent information leakage:

```typescript
import { createErrorResponse } from "../_shared/errorHandler.ts";

try {
  // Function logic
} catch (error) {
  return createErrorResponse(error, 'function-name', 500, corsHeaders);
}
```

### What Gets Sanitized

The error handler automatically sanitizes:

1. **API Keys and Secrets**: Any error mentioning "key", "secret", "token"
2. **Database Details**: SQL errors, query details
3. **Authentication Info**: JWT details, user credentials
4. **Payment Info**: Stripe-specific errors
5. **PII**: Email addresses (partially redacted), phone numbers, etc.

### Server-Side Logging

Full error details are logged server-side:

```typescript
logError('function-context', error, {
  userId: 'user_123',  // This gets sanitized
  email: 'user@example.com',  // This gets redacted to ***@example.com
  metadata: { ... }
});
```

### Client Responses

Clients receive generic, safe error messages:

```json
{
  "error": "An error occurred while processing your request.",
  "code": "INTERNAL_ERROR"
}
```

---

## Protected Scan Middleware

### useProtectedScan Hook

A centralized hook ensures consistent subscription validation:

```typescript
import { useProtectedScan } from '@/hooks/useProtectedScan';

function MyComponent() {
  const { canScan, scansRemaining, performProtectedScan, checkScanAllowed } = useProtectedScan();

  const handleScan = async () => {
    try {
      const result = await performProtectedScan(async () => {
        // Your scan logic here
        return await fetchTokenData(tokenId);
      });

      // Handle result
    } catch (error) {
      // Error already contains user-friendly message
      toast.error(error.message);
    }
  };

  return (
    <button
      disabled={!canScan}
      onClick={handleScan}
    >
      Scan Token ({scansRemaining} remaining)
    </button>
  );
}
```

### Features

1. **Automatic Subscription Checking**: Validates subscription before each scan
2. **User-Friendly Errors**: Provides clear messages about why scans are blocked
3. **Scan Count Tracking**: Automatically refreshes subscription status after scans
4. **UI State Management**: Provides `canScan` and `checkScanAllowed()` for button states

### Integration Points

Use `performProtectedScan()` in:

- Token search/scan operations
- Data refresh actions
- Any operation that consumes scan quota

---

## Best Practices

### 1. Always Use Service Role Judiciously

```typescript
// ✅ GOOD: Use service role for operations that need it
const supabaseService = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

// Only use for:
// - Webhook processing
// - Admin operations
// - Operations that bypass RLS by design

// ❌ BAD: Using service role when user's JWT would work
// This bypasses RLS unnecessarily
```

### 2. Validate User Input

```typescript
// ✅ GOOD: Normalize and validate
const normalizedToken = tokenId?.trim().toLowerCase().replace(/^\$/, '');
if (!normalizedToken) {
  throw new Error('Invalid token identifier');
}

// ❌ BAD: Using raw user input
const data = await query(userInput);
```

### 3. Use RLS Policies

```typescript
// ✅ GOOD: Let RLS enforce boundaries
const { data } = await supabase
  .from('subscribers')
  .select('*')
  .eq('user_id', userId);  // RLS automatically enforces this is the current user

// ❌ BAD: Relying only on application logic
const { data } = await supabaseAdmin  // Using admin client bypasses RLS
  .from('subscribers')
  .select('*')
  .eq('user_id', userId);  // No enforcement if logic is wrong
```

### 4. Rate Limiting (TO BE IMPLEMENTED)

```typescript
// Planned implementation:
import { rateLimit } from '../_shared/rateLimit.ts';

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userId = await getUserIdFromJWT(req);

  const limit = await rateLimit(ip, userId, {
    authenticated: 100, // requests per minute
    anonymous: 10
  });

  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: corsHeaders }
    );
  }

  // ... function logic
});
```

### 5. Cache Cleanup

Implement scheduled cleanup for expired cache entries:

```typescript
// Planned: Scheduled edge function
export const cleanupExpiredCache = async () => {
  const tables = [
    'token_metrics_cache',
    'token_data_cache',
    'token_search_cache'
  ];

  for (const table of tables) {
    await supabase
      .from(table)
      .delete()
      .lt('last_updated', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  }
};
```

---

## Testing Security

### RLS Policy Testing

```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to access another user's data (should fail)
SELECT * FROM subscribers WHERE user_id != 'user-uuid-here';

-- Try to access own data (should succeed)
SELECT * FROM subscribers WHERE user_id = 'user-uuid-here';
```

### CORS Testing

```bash
# Test with allowed origin
curl -H "Origin: http://localhost:8080" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-project.supabase.co/functions/v1/check-subscription

# Test with disallowed origin (should default to localhost)
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-project.supabase.co/functions/v1/check-subscription
```

### Authentication Testing

```bash
# Test without auth (should fail)
curl -X POST https://your-project.supabase.co/functions/v1/check-subscription

# Test with valid JWT (should succeed)
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-project.supabase.co/functions/v1/check-subscription
```

---

## Migration Checklist

When deploying these security improvements:

- [ ] Run all RLS migration files in order
- [ ] Update CORS allowed origins for production
- [ ] Deploy updated edge functions
- [ ] Test authentication flows
- [ ] Test RLS policies with test users
- [ ] Monitor error logs for issues
- [ ] Implement rate limiting
- [ ] Set up cache cleanup job
- [ ] Update frontend to use `useProtectedScan`
- [ ] Document any additional production domains

---

## Support and Questions

For questions about these security implementations, refer to:

- Main Security Audit: `SECURITY_AUDIT_REPORT.md`
- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- Edge Functions Security: https://supabase.com/docs/guides/functions/auth

---

**Last Updated:** 2025-10-30
**Security Review Date:** 2025-10-30
