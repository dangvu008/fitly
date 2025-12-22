-- Create hidden_outfits table
CREATE TABLE public.hidden_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_id UUID NOT NULL REFERENCES public.shared_outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, outfit_id)
);

-- Enable RLS
ALTER TABLE public.hidden_outfits ENABLE ROW LEVEL SECURITY;

-- Users can view their own hidden outfits
CREATE POLICY "Users can view own hidden outfits"
ON public.hidden_outfits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can hide outfits
CREATE POLICY "Users can hide outfits"
ON public.hidden_outfits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unhide outfits
CREATE POLICY "Users can unhide outfits"
ON public.hidden_outfits
FOR DELETE
USING (auth.uid() = user_id);

-- Create saved_outfits table (favorites)
CREATE TABLE public.saved_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_id UUID NOT NULL REFERENCES public.shared_outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, outfit_id)
);

-- Enable RLS
ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved outfits
CREATE POLICY "Users can view own saved outfits"
ON public.saved_outfits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save outfits
CREATE POLICY "Users can save outfits"
ON public.saved_outfits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave outfits
CREATE POLICY "Users can unsave outfits"
ON public.saved_outfits
FOR DELETE
USING (auth.uid() = user_id);