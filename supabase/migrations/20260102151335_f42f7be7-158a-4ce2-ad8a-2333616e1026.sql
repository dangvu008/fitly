-- Remove public read access from ai_cache table and restrict to service role only
-- Drop the existing permissive public read policy
DROP POLICY IF EXISTS "Anyone can read cache" ON public.ai_cache;

-- Create a new policy that only allows authenticated users to read their own cache (if we add user_id later)
-- For now, only service role can access cache through edge functions
-- The existing "Service role can manage cache" policy handles this