
// Allowed origins for CORS - Update these with your actual domain(s)
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  // Add your production domains here:
  // 'https://yourdomain.com',
  // 'https://app.yourdomain.com',
];

/**
 * Get CORS headers with origin validation
 * @param origin - The origin from the request headers
 * @returns CORS headers object with validated origin
 */
export const getCorsHeaders = (origin: string | null) => {
  // Check if the origin is in the allowed list
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // Default to localhost for development

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
};

// Legacy export for backward compatibility with existing edge functions
// TODO: Update all edge functions to use getCorsHeaders() instead
// This is kept as wildcard for now to avoid breaking changes
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
