-- Add default body image column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN default_body_image_url text DEFAULT NULL;