-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared_outfits table
CREATE TABLE IF NOT EXISTS shared_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  result_image_url TEXT NOT NULL,
  clothing_items JSONB DEFAULT '[]'::jsonb,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  inspired_by_outfit_id UUID REFERENCES shared_outfits(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create outfit_likes table
CREATE TABLE IF NOT EXISTS outfit_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL REFERENCES shared_outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- Create saved_outfits table
CREATE TABLE IF NOT EXISTS saved_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL REFERENCES shared_outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shared outfits policies
CREATE POLICY "Shared outfits are viewable by everyone"
  ON shared_outfits FOR SELECT USING (true);

CREATE POLICY "Users can create own outfits"
  ON shared_outfits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits"
  ON shared_outfits FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits"
  ON shared_outfits FOR DELETE USING (auth.uid() = user_id);

-- Outfit likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON outfit_likes FOR SELECT USING (true);

CREATE POLICY "Users can like outfits"
  ON outfit_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike outfits"
  ON outfit_likes FOR DELETE USING (auth.uid() = user_id);

-- Saved outfits policies
CREATE POLICY "Users can view own saved outfits"
  ON saved_outfits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save outfits"
  ON saved_outfits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave outfits"
  ON saved_outfits FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_outfits_user_id ON shared_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_outfits_created_at ON shared_outfits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_likes_outfit_id ON outfit_likes(outfit_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_id ON saved_outfits(user_id);
