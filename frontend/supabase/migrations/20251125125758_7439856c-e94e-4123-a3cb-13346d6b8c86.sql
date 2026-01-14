-- Create storage bucket for campaign cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-covers', 'campaign-covers', true);

-- Allow authenticated users to upload their own campaign covers
CREATE POLICY "Users can upload campaign covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-covers');

-- Allow everyone to view campaign covers
CREATE POLICY "Anyone can view campaign covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'campaign-covers');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their campaign covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their campaign covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-covers' AND auth.uid()::text = (storage.foldername(name))[1]);