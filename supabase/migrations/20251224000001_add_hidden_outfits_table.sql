-- Create hidden_outfits table for users to hide outfits from their feed
CREATE TABLE IF NOT EXISTS hidden_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- Enable RLS
ALTER TABLE hidden_outfits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own hidden outfits
CREATE POLICY "Users can view own hidden outfits"
  ON hidden_outfits FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own hidden outfits
CREATE POLICY "Users can hide outfits"
  ON hidden_outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own hidden outfits
CREATE POLICY "Users can unhide outfits"
  ON hidden_outfits FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hidden_outfits_user_id ON hidden_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_outfits_outfit_id ON hidden_outfits(outfit_id);
