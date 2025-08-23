/*
  # Create Storage Buckets

  1. Storage Setup
    - Create avatars bucket for user profile pictures
    - Create battle-exports bucket for battle result exports
  2. Security
    - Enable RLS on storage buckets
    - Add policies for authenticated users
*/

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create battle-exports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('battle-exports', 'battle-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Avatar upload policy
CREATE POLICY "Avatar uploads are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Battle exports policy
CREATE POLICY "Users can view their own battle exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'battle-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own battle exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'battle-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own battle exports"
ON storage.objects FOR DELETE
USING (bucket_id = 'battle-exports' AND auth.uid()::text = (storage.foldername(name))[1]);