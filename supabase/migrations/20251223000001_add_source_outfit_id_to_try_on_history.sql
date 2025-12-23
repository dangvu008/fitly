-- Add source_outfit_id column to try_on_history table
-- This column stores a reference to the original shared outfit when a user tries on an outfit from the feed
-- Requirements: 4.2 - WHEN a user saves a try-on result THEN the system SHALL store the result with reference to the original shared outfit

ALTER TABLE try_on_history
ADD COLUMN IF NOT EXISTS source_outfit_id uuid REFERENCES shared_outfits(id) ON DELETE SET NULL;

-- Add index for faster lookups when viewing saved try-on results with their source outfits
CREATE INDEX IF NOT EXISTS idx_try_on_history_source_outfit_id ON try_on_history(source_outfit_id);
