-- Create area_maps table for storing clickable regions on newspaper pages
CREATE TABLE IF NOT EXISTS area_maps (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES edition_pages(id) ON DELETE CASCADE,
  x DECIMAL(10, 2) NOT NULL,
  y DECIMAL(10, 2) NOT NULL,
  width DECIMAL(10, 2) NOT NULL,
  height DECIMAL(10, 2) NOT NULL,
  title VARCHAR(255),
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_area_maps_page_id ON area_maps(page_id);

-- Add RLS policies
ALTER TABLE area_maps ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON area_maps
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert" ON area_maps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON area_maps
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON area_maps
  FOR DELETE USING (true);
