-- Add inspired_by_outfit_id column to shared_outfits table
-- This column stores a reference to the original outfit that inspired this shared outfit
-- Requirements: 5.2, 5.3 - WHEN a user shares a try-on result THEN the system SHALL create a new shared outfit post with attribution to the original outfit

ALTER TABLE shared_outfits
ADD COLUMN IF NOT EXISTS inspired_by_outfit_id uuid REFERENCES shared_outfits(id) ON DELETE SET NULL;

-- Add index for faster lookups when displaying "Inspired by" links
CREATE INDEX IF NOT EXISTS idx_shared_outfits_inspired_by_outfit_id ON shared_outfits(inspired_by_outfit_id);
