-- Add homepage_layout column to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS homepage_layout TEXT;

-- Add site_header_layout column
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS site_header_layout TEXT;

-- Add site_footer_layout column
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS site_footer_layout TEXT;

-- Add comments
COMMENT ON COLUMN site_settings.homepage_layout IS 'Layout name to use for the homepage';
COMMENT ON COLUMN site_settings.site_header_layout IS 'Layout name to use for global site header';
COMMENT ON COLUMN site_settings.site_footer_layout IS 'Layout name to use for global site footer';
