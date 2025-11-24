-- Create area_maps table for storing clickable area mappings on edition pages
CREATE TABLE IF NOT EXISTS area_maps (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES edition_pages(id) ON DELETE CASCADE,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  linked_area_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_area_maps_page_id ON area_maps(page_id);

-- Add comment
COMMENT ON TABLE area_maps IS 'Clickable area mappings on edition pages with multi-page article linking support';
