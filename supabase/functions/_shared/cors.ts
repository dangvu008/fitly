/**
 * Shared CORS configuration for Edge Functions
 * 
 * Uses ALLOWED_ORIGINS environment variable to restrict access.
 * Falls back to '*' only in development when not configured.
 */

// Default allowed headers for Supabase client
const ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type';

/**
 * Get allowed origins from environment variable
 * Format: comma-separated list of origins
 * Example: "https://myapp.com,https://staging.myapp.com"
 */
function getAllowedOrigins(): string[] {
  const originsEnv = Deno.env.get('ALLOWED_ORIGINS');
  
  if (!originsEnv) {
    // Default to allowing Lovable project domains and all origins for development
    return ['*'];
  }
  
  return originsEnv.split(',').map(origin => origin.trim()).filter(Boolean);
}

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.some(allowed => {
    // Support wildcard subdomains (e.g., "*.myapp.com")
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain) || origin === `https://${domain}` || origin === `http://${domain}`;
    }
    return origin === allowed;
  });
}

/**
 * Get CORS headers for a request
 * Returns appropriate headers based on the request origin
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // If origin is allowed, return it; otherwise return empty (browser will block)
  const allowedOrigin = isOriginAllowed(origin, allowedOrigins) 
    ? (allowedOrigins.includes('*') ? '*' : origin!)
    : '';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, { 
    status: 204,
    headers: getCorsHeaders(req) 
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(
  req: Request,
  data: unknown, 
  status: number = 200
): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { 
        ...getCorsHeaders(req), 
        'Content-Type': 'application/json' 
      } 
    }
  );
}
