-- Add default body image fields to profiles table for One-Tap Try-On Flow
-- Requirements: 1.4 (save validated body image as default), 1.5 (change default body image in settings)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS default_body_image_url text DEFAULT NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS default_body_image_updated_at timestamp with time zone DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.default_body_image_url IS 'URL of the user default body image for quick try-on';
COMMENT ON COLUMN public.profiles.default_body_image_updated_at IS 'Timestamp when the default body image was last updated';
