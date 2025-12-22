-- Add is_purchased field to user_clothing table
ALTER TABLE public.user_clothing 
ADD COLUMN is_purchased boolean NOT NULL DEFAULT false;

-- Add is_favorite field to try_on_history table
ALTER TABLE public.try_on_history 
ADD COLUMN is_favorite boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_user_clothing_purchased ON public.user_clothing(user_id, is_purchased);
CREATE INDEX idx_try_on_history_favorite ON public.try_on_history(user_id, is_favorite);