-- Add SEO columns and scheduled_date to editions table
ALTER TABLE editions 
ADD COLUMN IF NOT EXISTS seo_h1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS seo_meta_description TEXT,
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;
