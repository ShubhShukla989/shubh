-- Create epaper_settings table
CREATE TABLE IF NOT EXISTS epaper_settings (
  id SERIAL PRIMARY KEY,
  entries_per_page INTEGER DEFAULT 12,
  include_header_footer_map BOOLEAN DEFAULT FALSE,
  include_header_footer_clip BOOLEAN DEFAULT FALSE,
  default_publishing_status VARCHAR(50) DEFAULT 'publish-immediately',
  disable_right_click BOOLEAN DEFAULT FALSE,
  keep_archive_days INTEGER DEFAULT 0,
  use_random_prefix BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO epaper_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create area_map_watermark_settings table
CREATE TABLE IF NOT EXISTS area_map_watermark_settings (
  id SERIAL PRIMARY KEY,
  enable_watermarking BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  opacity INTEGER DEFAULT 100,
  mode VARCHAR(50) DEFAULT 'in_outerside',
  position VARCHAR(50) DEFAULT 'top_center',
  min_width_px INTEGER DEFAULT 0,
  background_color VARCHAR(20) DEFAULT '#ffffff',
  foreground_color VARCHAR(20) DEFAULT '#000000',
  enable_border BOOLEAN DEFAULT FALSE,
  border_width INTEGER DEFAULT 2,
  border_color VARCHAR(20) DEFAULT '#000000',
  info_text TEXT,
  info_text_font VARCHAR(50) DEFAULT 'English',
  enable_center_watermark BOOLEAN DEFAULT FALSE,
  center_watermark_url TEXT,
  center_watermark_opacity INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default watermark settings
INSERT INTO area_map_watermark_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
