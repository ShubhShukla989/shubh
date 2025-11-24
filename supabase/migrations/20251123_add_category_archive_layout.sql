-- Add archive_layout column to epaper_categories table
ALTER TABLE epaper_categories
ADD COLUMN IF NOT EXISTS archive_layout TEXT;

-- Add comment
COMMENT ON COLUMN epaper_categories.archive_layout IS 'Layout name from Page Designer to use for category archive page';
