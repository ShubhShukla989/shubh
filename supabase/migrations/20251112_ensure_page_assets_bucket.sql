-- Ensure page-assets storage bucket exists with proper policies
-- This is needed for storing extracted PDF pages

-- Create bucket if it doesn't exist (this will fail silently if it exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-assets', 'page-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set bucket to public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'page-assets';

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Service role can do everything" ON storage.objects;

-- Allow public read access to page-assets
CREATE POLICY "Public can read page-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'page-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated can upload to page-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'page-assets');

-- Allow service role full access
CREATE POLICY "Service role full access to page-assets"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'page-assets')
WITH CHECK (bucket_id = 'page-assets');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated can update page-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'page-assets')
WITH CHECK (bucket_id = 'page-assets');

CREATE POLICY "Authenticated can delete page-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'page-assets');
