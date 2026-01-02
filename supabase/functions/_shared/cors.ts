/**
 * Shared CORS configuration for Edge Functions
 * 
 * Restricts access to Lovable domains by default for security.
 * Set ALLOWED_ORIGINS environment variable to customize.
 */

// Default allowed headers for Supabase client
const ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type';

// Default allowed origins - Lovable domains only
const DEFAULT_ALLOWED_ORIGINS = [
  'https://*.lovable.app',
  'https://*.lovableproject.com',
  'https://lovable.dev',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

/**
 * Get allowed origins from environment variable or use defaults
 * Format: comma-separated list of origins
 * Example: "https://myapp.com,https://staging.myapp.com"
 */
function getAllowedOrigins(): string[] {
  const originsEnv = Deno.env.get('ALLOWED_ORIGINS');
  
  if (originsEnv) {
    return originsEnv.split(',').map(origin => origin.trim()).filter(Boolean);
  }
  
  // Default to Lovable domains and localhost for development
  return DEFAULT_ALLOWED_ORIGINS;
}

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes('*')) return true;
  
  return allowedOrigins.some(allowed => {
    // Support wildcard subdomains (e.g., "https://*.myapp.com")
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
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
    ? origin!
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
