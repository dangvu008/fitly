/**
 * Shared authentication utilities for Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify JWT token and extract user ID
 * Returns authenticated: true with userId if valid, false with error otherwise
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return { authenticated: false, error: 'Authorization header required' };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing for auth');
    return { authenticated: false, error: 'Service temporarily unavailable' };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false, error: 'Invalid or expired token' };
    }

    return { authenticated: true, userId: user.id };
  } catch (err) {
    console.error('Auth verification error:', err);
    return { authenticated: false, error: 'Authentication failed' };
  }
}
