-- Fix category system to ensure new categories work with editions
-- This migration ensures proper foreign key relationship

-- Step 1: Check if epaper_categories table exists, if not create it
CREATE TABLE IF NOT EXISTS epaper_categories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  alias VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES epaper_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  
  -- SEO Fields
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  robots VARCHAR(100) DEFAULT 'index, follow',
  
  -- Status and ordering
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_epaper_categories_alias ON epaper_categories(alias);
CREATE INDEX IF NOT EXISTS idx_epaper_categories_parent ON epaper_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_epaper_categories_active ON epaper_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_epaper_categories_featured ON epaper_categories(is_featured);

-- Step 3: Remove old category_id column if it references wrong table
DO $$ 
BEGIN
  -- Check if category_id exists and references 'categories' table
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'editions' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'categories'
      AND ccu.column_name = 'id'
  ) THEN
    -- Drop the old foreign key constraint
    ALTER TABLE editions DROP CONSTRAINT IF EXISTS editions_category_id_fkey;
    -- Drop the column
    ALTER TABLE editions DROP COLUMN IF EXISTS category_id;
  END IF;
END $$;

-- Step 4: Add category_id column with correct reference to epaper_categories
ALTER TABLE editions 
ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Step 5: Drop old constraint if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'editions_category_id_fkey' 
      AND table_name = 'editions'
  ) THEN
    ALTER TABLE editions DROP CONSTRAINT editions_category_id_fkey;
  END IF;
END $$;

-- Step 6: Add new foreign key constraint
ALTER TABLE editions 
ADD CONSTRAINT editions_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES epaper_categories(id) 
ON DELETE SET NULL;

-- Step 7: Create index on category_id
CREATE INDEX IF NOT EXISTS idx_editions_category ON editions(category_id);

-- Step 8: Insert default categories if they don't exist
INSERT INTO epaper_categories (title, alias, description, is_featured, display_order, is_active) VALUES
('Mumbai Edition', 'mumbai', 'Mumbai regional edition of the newspaper', true, 1, true),
('Lucknow Edition', 'lucknow', 'Lucknow regional edition of the newspaper', true, 2, true),
('Delhi Edition', 'delhi', 'Delhi regional edition of the newspaper', true, 3, true)
ON CONFLICT (alias) DO UPDATE SET
  is_active = true,  -- Ensure they are active
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- Step 9: Create or replace function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_epaper_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger
DROP TRIGGER IF EXISTS trigger_update_epaper_categories_updated_at ON epaper_categories;
CREATE TRIGGER trigger_update_epaper_categories_updated_at
  BEFORE UPDATE ON epaper_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_epaper_categories_updated_at();

-- Step 11: Verify the setup
DO $$
DECLARE
  cat_count INTEGER;
  fk_exists BOOLEAN;
BEGIN
  -- Count categories
  SELECT COUNT(*) INTO cat_count FROM epaper_categories;
  RAISE NOTICE 'Total categories in epaper_categories: %', cat_count;
  
  -- Check foreign key
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'editions' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'epaper_categories'
  ) INTO fk_exists;
  
  IF fk_exists THEN
    RAISE NOTICE '✅ Foreign key correctly references epaper_categories';
  ELSE
    RAISE WARNING '❌ Foreign key does NOT reference epaper_categories';
  END IF;
END $$;
