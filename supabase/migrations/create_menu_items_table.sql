-- Create menu_items table for menu management system
-- This table stores individual menu items that belong to menus

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  menu_id INT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('external', 'page', 'epaper_category', 'epaper_archive')),
  url TEXT,
  page_id INT REFERENCES pages(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  parent_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX idx_menu_items_position ON menu_items(position);
CREATE INDEX idx_menu_items_parent_id ON menu_items(parent_id);

-- Add updated_at trigger
CREATE TRIGGER update_menu_items_updated_at 
  BEFORE UPDATE ON menu_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE menu_items IS 'Stores individual menu items with support for pages, external links, and epaper archives';
