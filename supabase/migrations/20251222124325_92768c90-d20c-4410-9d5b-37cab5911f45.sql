-- Create table to store user category corrections for AI learning
CREATE TABLE public.category_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_hash TEXT NOT NULL,
  ai_predicted_category TEXT,
  user_selected_category TEXT NOT NULL,
  image_features JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.category_corrections ENABLE ROW LEVEL SECURITY;

-- Users can view all corrections (for AI learning)
CREATE POLICY "Anyone can view corrections for AI learning" 
ON public.category_corrections 
FOR SELECT 
USING (true);

-- Users can create corrections
CREATE POLICY "Authenticated users can create corrections" 
ON public.category_corrections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_category_corrections_category ON public.category_corrections(user_selected_category);
CREATE INDEX idx_category_corrections_features ON public.category_corrections USING GIN(image_features);