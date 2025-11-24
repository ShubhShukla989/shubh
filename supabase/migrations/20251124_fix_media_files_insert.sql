-- Fix media_files insert issues

-- 1. Check and fix sequence
SELECT setval('media_files_id_seq', COALESCE((SELECT MAX(id) FROM media_files), 0) + 1, false);

-- 2. Disable RLS if enabled (for admin operations)
ALTER TABLE media_files DISABLE ROW LEVEL SECURITY;

-- 3. Add helpful indexes if missing
CREATE INDEX IF NOT EXISTS idx_media_files_file_path ON media_files(file_path);
CREATE INDEX IF NOT EXISTS idx_media_files_file_url ON media_files(file_url);

-- 4. Verify table permissions
GRANT ALL ON media_files TO authenticated;
GRANT ALL ON media_files TO anon;
GRANT USAGE, SELECT ON SEQUENCE media_files_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE media_files_id_seq TO anon;

-- 5. Check current state
SELECT 
    'Current max ID: ' || COALESCE(MAX(id), 0) as info,
    'Total records: ' || COUNT(*) as count
FROM media_files;
