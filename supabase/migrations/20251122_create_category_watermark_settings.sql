-- Create category_watermark_settings table
CREATE TABLE IF NOT EXISTS category_watermark_settings (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Override settings
  override_global_settings BOOLEAN DEFAULT false,
  enable_watermarking BOOLEAN DEFAULT false,
  
  -- Logo settings
  logo_url TEXT,
  opacity INTEGER DEFAULT 100 CHECK (opacity >= 0 AND opacity <= 100),
  mode VARCHAR(50) DEFAULT 'in_outerside', -- 'in_outerside', 'overlay', etc.
  position VARCHAR(50) DEFAULT 'top_center', -- 'top_center', 'bottom_right', etc.
  min_width_px INTEGER DEFAULT 0,
  
  -- Color settings
  background_color VARCHAR(7), -- hex color
  foreground_color VARCHAR(7), -- hex color for text
  
  -- Border settings
  enable_border BOOLEAN DEFAULT false,
  border_width INTEGER DEFAULT 2,
  border_color VARCHAR(7),
  
  -- Info text settings (for 'in_outerside' mode)
  info_text TEXT,
  info_text_font VARCHAR(100) DEFAULT 'English',
  
  -- Extra watermark on center
  enable_center_watermark BOOLEAN DEFAULT false,
  center_watermark_url TEXT,
  center_watermark_opacity INTEGER DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one setting per category
  UNIQUE(category_id)
);

-- Create index for faster lookups
CREATE INDEX idx_category_watermark_settings_category_id ON category_watermark_settings(category_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_category_watermark_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_watermark_settings_updated_at
  BEFORE UPDATE ON category_watermark_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_category_watermark_settings_updated_at();

-- Add RLS policies
ALTER TABLE category_watermark_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read category watermark settings"
  ON category_watermark_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert category watermark settings"
  ON category_watermark_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update category watermark settings"
  ON category_watermark_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete category watermark settings"
  ON category_watermark_settings
  FOR DELETE
  TO authenticated
  USING (true);
