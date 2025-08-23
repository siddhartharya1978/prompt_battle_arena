-- Create storage buckets for Prompt Battle Arena
-- This script creates the necessary storage buckets with proper policies

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create battle-exports bucket for sharing battle results
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'battle-exports',
  'battle-exports',
  true,
  10485760, -- 10MB limit
  ARRAY['application/json', 'text/plain', 'application/pdf', 'image/png', 'image/jpeg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Storage policies for battle-exports bucket
CREATE POLICY "Users can upload their own battle exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'battle-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own battle exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'battle-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own battle exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'battle-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin policies for both buckets
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all battle exports"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'battle-exports' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);