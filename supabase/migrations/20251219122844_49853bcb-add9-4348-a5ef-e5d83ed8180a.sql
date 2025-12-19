-- Create storage bucket for try-on images
INSERT INTO storage.buckets (id, name, public) VALUES ('try-on-images', 'try-on-images', true);

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own try-on images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'try-on-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view try-on images (public bucket)
CREATE POLICY "Anyone can view try-on images"
ON storage.objects FOR SELECT
USING (bucket_id = 'try-on-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own try-on images"
ON storage.objects FOR DELETE
USING (bucket_id = 'try-on-images' AND auth.uid()::text = (storage.foldername(name))[1]);