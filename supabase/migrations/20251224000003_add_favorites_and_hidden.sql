-- Add is_favorite and is_hidden columns to user_clothing table
ALTER TABLE user_clothing 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Create favorite_outfits table for saving favorite shared outfits
CREATE TABLE IF NOT EXISTS favorite_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL REFERENCES shared_outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- Enable RLS
ALTER TABLE favorite_outfits ENABLE ROW LEVEL SECURITY;

-- Policies for favorite_outfits
CREATE POLICY "Users can view own favorite outfits"
  ON favorite_outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite outfits"
  ON favorite_outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorite outfits"
  ON favorite_outfits FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_clothing_is_favorite ON user_clothing(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_user_clothing_is_hidden ON user_clothing(user_id, is_hidden) WHERE is_hidden = true;
CREATE INDEX IF NOT EXISTS idx_favorite_outfits_user_id ON favorite_outfits(user_id);
