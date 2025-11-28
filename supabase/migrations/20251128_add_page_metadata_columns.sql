-- Add metadata columns to edition_pages table
-- Migration: Add title, alias, description, and category columns

-- Add title column (default to page number)
ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add alias column (default to page-{number})
ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS alias TEXT;

-- Add description column
ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add category column (simple text field, not FK)
ALTER TABLE edition_pages 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing rows with default values
UPDATE edition_pages 
SET 
  title = COALESCE(title, 'Page ' || page_number),
  alias = COALESCE(alias, 'page-' || page_number),
  description = COALESCE(description, ''),
  category = COALESCE(category, '')
WHERE title IS NULL OR alias IS NULL OR description IS NULL OR category IS NULL;

-- Add index on alias for faster lookups
CREATE INDEX IF NOT EXISTS idx_edition_pages_alias ON edition_pages(alias);

-- Add comment
COMMENT ON COLUMN edition_pages.title IS 'Display title for the page';
COMMENT ON COLUMN edition_pages.alias IS 'URL-friendly alias for the page';
COMMENT ON COLUMN edition_pages.description IS 'Optional description of the page content';
COMMENT ON COLUMN edition_pages.category IS 'Page category (e.g., front-page, sports, business)';
