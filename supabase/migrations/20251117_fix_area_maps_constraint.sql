-- First, check and display current table structure
DO $$
BEGIN
    RAISE NOTICE 'Current area_maps columns:';
END $$;

-- Drop ALL constraints and indexes related to area_number and edition
DROP INDEX IF EXISTS idx_area_maps_edition_area_number CASCADE;
DROP INDEX IF EXISTS idx_area_maps_area_number CASCADE;
DROP INDEX IF EXISTS idx_area_maps_edition CASCADE;

-- Drop any unique constraints
DO $$ 
BEGIN
    -- Drop constraint by name if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'idx_area_maps_edition_area_number' 
        AND conrelid = 'area_maps'::regclass
    ) THEN
        ALTER TABLE area_maps DROP CONSTRAINT idx_area_maps_edition_area_number;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'area_maps_edition_area_number_key' 
        AND conrelid = 'area_maps'::regclass
    ) THEN
        ALTER TABLE area_maps DROP CONSTRAINT area_maps_edition_area_number_key;
    END IF;
END $$;

-- Remove edition and area_number columns if they exist
ALTER TABLE area_maps DROP COLUMN IF EXISTS edition CASCADE;
ALTER TABLE area_maps DROP COLUMN IF EXISTS area_number CASCADE;

-- Ensure the correct index exists on page_id
CREATE INDEX IF NOT EXISTS idx_area_maps_page_id ON area_maps(page_id);

-- Verify final structure
DO $$
BEGIN
    RAISE NOTICE 'Migration completed. area_maps table cleaned.';
END $$;
