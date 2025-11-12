-- Create epaper_categories table for managing regional editions
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

-- Create index for faster queries
CREATE INDEX idx_epaper_categories_alias ON epaper_categories(alias);
CREATE INDEX idx_epaper_categories_parent ON epaper_categories(parent_id);
CREATE INDEX idx_epaper_categories_active ON epaper_categories(is_active);
CREATE INDEX idx_epaper_categories_featured ON epaper_categories(is_featured);

-- Add category_id to editions table to link editions with categories
ALTER TABLE editions 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES epaper_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_editions_category ON editions(category_id);

-- Insert default categories
INSERT INTO epaper_categories (title, alias, description, is_featured, display_order) VALUES
('Mumbai Edition', 'mumbai', 'Mumbai regional edition of the newspaper', true, 1),
('Lucknow Edition', 'lucknow', 'Lucknow regional edition of the newspaper', true, 2),
('Delhi Edition', 'delhi', 'Delhi regional edition of the newspaper', true, 3)
ON CONFLICT (alias) DO NOTHING;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_epaper_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_epaper_categories_updated_at ON epaper_categories;
CREATE TRIGGER trigger_update_epaper_categories_updated_at
  BEFORE UPDATE ON epaper_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_epaper_categories_updated_at();
