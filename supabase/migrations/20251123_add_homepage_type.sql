-- Add homepage_type column to site_settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS homepage_type VARCHAR(50) DEFAULT 'normal';

-- Add comment
COMMENT ON COLUMN site_settings.homepage_type IS 'Type of homepage: normal, archive, or latest-edition';

-- Update existing row if exists
UPDATE site_settings 
SET homepage_type = 'normal' 
WHERE homepage_type IS NULL;
