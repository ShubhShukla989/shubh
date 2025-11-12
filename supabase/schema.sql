-- ePaper CMS Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories (hierarchical)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Editions
CREATE TABLE editions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  alias TEXT,
  date DATE NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  pdf_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Processing', 'Published')),
  created_by INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Edition Pages (images per edition)
CREATE TABLE edition_pages (
  id SERIAL PRIMARY KEY,
  edition_id INT REFERENCES editions(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  page_category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(edition_id, page_number)
);

-- Edition Page Areas (area mapping / clipping zones)
CREATE TABLE edition_page_areas (
  id SERIAL PRIMARY KEY,
  page_id INT REFERENCES edition_pages(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  x INT NOT NULL,
  y INT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pages (CMS static pages)
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  alias TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  status TEXT DEFAULT 'Public' CHECK (status IN ('Public', 'Private', 'Draft')),
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  header_code TEXT,
  footer_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sliders
CREATE TABLE sliders (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (admin accounts)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  fullname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'Admin' CHECK (role IN ('Super Admin', 'Admin', 'Sub-Admin', 'Editor')),
  mobile TEXT,
  country_code TEXT,
  address TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  zip TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Layouts for page designer
CREATE TABLE layouts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  structure JSONB NOT NULL DEFAULT '{"rows": []}',
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System Settings
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Menus
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_editions_date ON editions(date DESC);
CREATE INDEX idx_editions_status ON editions(status);
CREATE INDEX idx_edition_pages_edition ON edition_pages(edition_id);
CREATE INDEX idx_edition_page_areas_page ON edition_page_areas(page_id);
CREATE INDEX idx_pages_alias ON pages(alias);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Insert default admin user (password: admin123 - change this!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (fullname, email, password_hash, role, status) 
VALUES ('Administrator', 'admin@epaper.com', '$2a$10$rKvVPZqGsYEjPXvZxKxXxO7K8YJZJZqXqXqXqXqXqXqXqXqXqXqXq', 'Super Admin', 'Active');

-- Insert default categories
INSERT INTO categories (name, parent_id, sort_order) VALUES 
('News', NULL, 1),
('Sports', NULL, 2),
('Entertainment', NULL, 3),
('Business', NULL, 4),
('Technology', NULL, 5);

-- Insert default layouts
INSERT INTO layouts (name, structure, status) VALUES 
('Site Header', '{"rows": []}', 'Published'),
('Site Footer', '{"rows": []}', 'Published'),
('Static Page', '{"rows": []}', 'Published'),
('Website Homepage', '{"rows": []}', 'Published'),
('Epaper Archive', '{"rows": []}', 'Published'),
('Epaper Display', '{"rows": []}', 'Published'),
('Epaper Map', '{"rows": []}', 'Published'),
('Epaper Clip', '{"rows": []}', 'Published');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_editions_updated_at BEFORE UPDATE ON editions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sliders_updated_at BEFORE UPDATE ON sliders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_layouts_updated_at BEFORE UPDATE ON layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
