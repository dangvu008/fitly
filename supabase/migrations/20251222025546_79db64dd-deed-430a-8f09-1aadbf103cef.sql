-- Create outfit_likes table to track user likes
CREATE TABLE public.outfit_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_id UUID NOT NULL REFERENCES public.shared_outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, outfit_id)
);

-- Enable RLS
ALTER TABLE public.outfit_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view likes count"
ON public.outfit_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can like outfits"
ON public.outfit_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON public.outfit_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_outfit_likes_outfit_id ON public.outfit_likes(outfit_id);
CREATE INDEX idx_outfit_likes_user_id ON public.outfit_likes(user_id);

-- Function to update likes_count on shared_outfits
CREATE OR REPLACE FUNCTION public.update_outfit_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shared_outfits 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.outfit_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shared_outfits 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.outfit_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update likes_count
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON public.outfit_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_outfit_likes_count();