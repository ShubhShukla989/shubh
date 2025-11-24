-- Remove the columns that were added but not used in code
-- This will fix the "area_number" error

-- Drop the unique index first
DROP INDEX IF EXISTS idx_area_maps_edition_area_number;

-- Drop the edition_id index
DROP INDEX IF EXISTS idx_area_maps_edition_id;

-- Remove the columns
ALTER TABLE area_maps DROP COLUMN IF EXISTS edition_id CASCADE;
ALTER TABLE area_maps DROP COLUMN IF EXISTS area_number CASCADE;

-- Verify the table structure is correct
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'area_maps'
ORDER BY ordinal_position;
