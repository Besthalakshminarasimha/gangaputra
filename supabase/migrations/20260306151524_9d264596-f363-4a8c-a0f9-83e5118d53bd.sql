
-- Create storage bucket for job profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('job-profiles', 'job-profiles', true);

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload own job profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'job-profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own job profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'job-profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own job profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'job-profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view job profile images (public bucket)
CREATE POLICY "Anyone can view job profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-profiles');
