-- Permanent fix for edition_pages RLS policies
-- This ensures the API can always read/write pages

-- Enable RLS on edition_pages
ALTER TABLE edition_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can do everything on edition_pages" ON edition_pages;
DROP POLICY IF EXISTS "Anyone can read edition_pages" ON edition_pages;

-- Allow service role (supabaseAdmin) to do everything
CREATE POLICY "Service role can do everything on edition_pages"
ON edition_pages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public read access for frontend display
CREATE POLICY "Anyone can read edition_pages"
ON edition_pages
FOR SELECT
TO anon, authenticated
USING (true);

-- Also ensure area_maps table has proper policies
ALTER TABLE area_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do everything on area_maps" ON area_maps;
DROP POLICY IF EXISTS "Anyone can read area_maps" ON area_maps;

CREATE POLICY "Service role can do everything on area_maps"
ON area_maps
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can read area_maps"
ON area_maps
FOR SELECT
TO anon, authenticated
USING (true);
