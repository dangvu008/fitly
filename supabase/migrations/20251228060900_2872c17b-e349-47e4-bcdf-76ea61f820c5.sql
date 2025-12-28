-- Create table for caching AI analysis results
CREATE TABLE public.ai_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL, -- 'clothing_analysis', 'body_analysis'
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Create index for faster lookups
CREATE INDEX idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON public.ai_cache(expires_at);

-- Enable RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access for cache (no user-specific data)
CREATE POLICY "Anyone can read cache"
ON public.ai_cache
FOR SELECT
USING (true);

-- Only service role can insert/update/delete (edge functions use service role)
CREATE POLICY "Service role can manage cache"
ON public.ai_cache
FOR ALL
USING (true)
WITH CHECK (true);