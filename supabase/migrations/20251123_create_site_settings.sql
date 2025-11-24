-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default home page setting
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('home_page', 'website-homepage')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
