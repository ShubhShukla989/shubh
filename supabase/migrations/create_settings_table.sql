-- Create settings table for storing system settings
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access for ads.txt and robots.txt
CREATE POLICY "Allow public read access" ON settings
  FOR SELECT USING (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON settings
  FOR ALL USING (true);

-- Insert default values
INSERT INTO settings (key, value) VALUES
  ('ads_txt', ''),
  ('robots_txt', 'User-agent: *
Disallow: /admin/
Disallow: /login

Sitemap: https://yourdomain.com/sitemap.xml'),
  ('analytics_measurement_id', '')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE settings IS 'Stores system-wide settings like ads.txt, robots.txt, analytics ID';
