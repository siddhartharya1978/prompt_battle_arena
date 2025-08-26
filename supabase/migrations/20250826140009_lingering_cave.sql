@@ .. @@
-- =====================================================
-- PHASE 8: STORAGE BUCKET SETUP
-- =====================================================

+-- Drop existing storage policies first
+DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
+DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
+DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
+DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
+DROP POLICY IF EXISTS "Users can access their own battle exports" ON storage.objects;
+DROP POLICY IF EXISTS "Users can create their own battle exports" ON storage.objects;
+DROP POLICY IF EXISTS "Users can delete their own battle exports" ON storage.objects;
+
 -- Create storage buckets
 INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 VALUES 
     ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
     ('battle-exports', 'battle-exports', false, 10485760, ARRAY['application/json', 'text/csv'])
 ON CONFLICT (id) DO UPDATE SET
     public = EXCLUDED.public,
     file_size_limit = EXCLUDED.file_size_limit,
     allowed_mime_types = EXCLUDED.allowed_mime_types;