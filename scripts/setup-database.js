#!/usr/bin/env node

/**
 * Database Setup Script
 * Run this after cloning the project to set up a fresh database
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'epapercms.db');
const backupPath = path.join(dbDir, 'epapercms_backup.db');

// Handle existing database
if (fs.existsSync(dbPath)) {
  try {
    // Try to backup existing database first
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    fs.copyFileSync(dbPath, backupPath);
    console.log('📋 Backed up existing database');
    
    // Remove existing database
    fs.unlinkSync(dbPath);
    console.log('🗑️  Removed existing database');
  } catch (error) {
    if (error.code === 'EBUSY') {
      console.log('⚠️  Database is in use. Please stop the application first.');
      console.log('   Run: npm run dev (stop with Ctrl+C)');
      console.log('   Or use a different database name for testing.');
      process.exit(1);
    } else {
      throw error;
    }
  }
}

// Create new database
const db = new Database(dbPath);
console.log('📦 Created fresh database at:', dbPath);

// Create tables (from schema)
const createTables = `
-- Users and Roles
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'Admin',
  mobile TEXT,
  country_code TEXT,
  address TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  zip TEXT,
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  role_id INTEGER DEFAULT 2
);

CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_key TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  alias TEXT,
  status TEXT DEFAULT 'active',
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE epaper_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  alias TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER,
  image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  robots TEXT DEFAULT 'index, follow',
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  archive_layout TEXT
);

-- Editions
CREATE TABLE editions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  alias TEXT,
  date TEXT NOT NULL,
  category_id INTEGER,
  pdf_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'Draft',
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_featured INTEGER DEFAULT 0,
  seo_h1 TEXT,
  seo_meta_description TEXT,
  scheduled_date TEXT
);

CREATE TABLE edition_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  edition_id INTEGER,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  page_category_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  title TEXT,
  alias TEXT,
  description TEXT,
  category TEXT
);

CREATE TABLE edition_page_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER,
  area_name TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE area_maps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  title TEXT,
  url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  linked_area_ids TEXT DEFAULT '{}',
  linked_page_number INTEGER,
  edition_id INTEGER
);

-- Media
CREATE TABLE media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  title TEXT,
  alt_text TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media_file_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_file_id INTEGER,
  media_tag_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Layouts
CREATE TABLE layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  structure TEXT NOT NULL DEFAULT '{"rows": []}',
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  custom_css TEXT DEFAULT '',
  custom_js TEXT DEFAULT ''
);

CREATE TABLE layout_backups (
  id TEXT PRIMARY KEY,
  layout_name TEXT NOT NULL,
  structure TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pages and Menus
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  alias TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  status TEXT DEFAULT 'Public',
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  header_code TEXT,
  footer_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  items TEXT DEFAULT '[]',
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  alias TEXT UNIQUE
);

CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  page_id INTEGER,
  category_id INTEGER,
  position INTEGER DEFAULT 0,
  parent_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sliders
CREATE TABLE sliders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  alias TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active',
  config TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slider_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  alt TEXT DEFAULT '',
  link TEXT,
  position INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'text',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  homepage_layout TEXT,
  site_header_layout TEXT,
  site_footer_layout TEXT,
  homepage_type TEXT DEFAULT 'normal',
  default_category_id INTEGER
);

CREATE TABLE epaper_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entries_per_page INTEGER DEFAULT 12,
  include_header_footer_map INTEGER DEFAULT 0,
  include_header_footer_clip INTEGER DEFAULT 0,
  default_publishing_status TEXT DEFAULT 'publish-immediately',
  disable_right_click INTEGER DEFAULT 0,
  keep_archive_days INTEGER DEFAULT 0,
  use_random_prefix INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE area_map_watermark_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enable_watermarking INTEGER DEFAULT 0,
  logo_url TEXT,
  opacity INTEGER DEFAULT 100,
  mode TEXT DEFAULT 'in_outerside',
  position TEXT DEFAULT 'top_center',
  min_width_px INTEGER DEFAULT 0,
  background_color TEXT DEFAULT '#ffffff',
  foreground_color TEXT DEFAULT '#000000',
  enable_border INTEGER DEFAULT 0,
  border_width INTEGER DEFAULT 2,
  border_color TEXT DEFAULT '#000000',
  info_text TEXT,
  info_text_font TEXT DEFAULT 'English',
  enable_center_watermark INTEGER DEFAULT 0,
  center_watermark_url TEXT,
  center_watermark_opacity INTEGER DEFAULT 100,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category_watermark_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER UNIQUE NOT NULL,
  override_global_settings INTEGER DEFAULT 0,
  enable_watermarking INTEGER DEFAULT 0,
  logo_url TEXT,
  opacity INTEGER DEFAULT 100,
  mode TEXT DEFAULT 'in_outerside',
  position TEXT DEFAULT 'top_center',
  min_width_px INTEGER DEFAULT 0,
  background_color TEXT DEFAULT '#ffffff',
  foreground_color TEXT DEFAULT '#000000',
  enable_border INTEGER DEFAULT 0,
  border_width INTEGER DEFAULT 2,
  border_color TEXT DEFAULT '#000000',
  info_text TEXT,
  info_text_font TEXT DEFAULT 'English',
  enable_center_watermark INTEGER DEFAULT 0,
  center_watermark_url TEXT,
  center_watermark_opacity INTEGER DEFAULT 100,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Analytics
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_url TEXT NOT NULL,
  user_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  edition_id INTEGER,
  page_number INTEGER,
  view_duration INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE active_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  user_ip TEXT,
  current_page TEXT,
  last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

// Execute table creation
db.exec(createTables);
console.log('📋 Created database tables');

// Insert sample data
const insertSampleData = `
-- Sample roles
INSERT INTO roles (id, name, description) VALUES 
(1, 'Super Admin', 'Full system access'),
(2, 'Admin', 'Administrative access'),
(3, 'Editor', 'Content editing access'),
(4, 'User', 'Basic user access');

-- Super Admin user (password: admin123) - Full system access
INSERT INTO users (fullname, email, password_hash, role, role_id) VALUES 
('Super Administrator', 'admin@example.com', '$2b$10$xo1MaBLzl25yLoxcKvF97eWighiHLL5Um/LV9F0xLIceM3oZU9FBG', 'Super Admin', 1);

-- Comprehensive permissions system
INSERT INTO permissions (key, name, description, category) VALUES 
('editions.create', 'Create Editions', 'Can create new editions', 'Editions'),
('editions.edit', 'Edit Editions', 'Can edit existing editions', 'Editions'),
('editions.delete', 'Delete Editions', 'Can delete editions', 'Editions'),
('editions.publish', 'Publish Editions', 'Can publish editions', 'Editions'),
('media.upload', 'Upload Media', 'Can upload media files', 'Media'),
('media.manage', 'Manage Media', 'Can manage media files', 'Media'),
('layouts.create', 'Create Layouts', 'Can create layouts', 'Layouts'),
('layouts.edit', 'Edit Layouts', 'Can edit layouts', 'Layouts'),
('settings.manage', 'Manage Settings', 'Can manage system settings', 'Settings'),
('view_dashboard', 'View Dashboard', 'Can access admin dashboard', 'Dashboard'),
('view_designer', 'View Designer', 'Can access page designer', 'Designer'),
('view_pages', 'View Pages', 'Can view pages section', 'Pages'),
('view_media', 'View Media', 'Can view media library', 'Media'),
('view_users', 'View Users', 'Can view user management', 'Users'),
('view_settings', 'View Settings', 'Can view system settings', 'Settings'),
('view_categories', 'View Categories', 'Can view categories', 'Categories'),
('view_sliders', 'View Sliders', 'Can view sliders', 'Sliders'),
('view_menus', 'View Menus', 'Can view menu management', 'Menus'),
('create_users', 'Create Users', 'Can create new users', 'Users'),
('edit_users', 'Edit Users', 'Can edit existing users', 'Users'),
('delete_users', 'Delete Users', 'Can delete users', 'Users');

-- Super Admin role permissions (Full access to everything)
INSERT INTO role_permissions (role_id, permission_key) VALUES 
(1, 'editions.create'),
(1, 'editions.edit'),
(1, 'editions.delete'),
(1, 'editions.publish'),
(1, 'media.upload'),
(1, 'media.manage'),
(1, 'layouts.create'),
(1, 'layouts.edit'),
(1, 'settings.manage'),
(1, 'view_dashboard'),
(1, 'view_designer'),
(1, 'view_pages'),
(1, 'view_media'),
(1, 'view_users'),
(1, 'view_settings'),
(1, 'view_categories'),
(1, 'view_sliders'),
(1, 'view_menus'),
(1, 'create_users'),
(1, 'edit_users'),
(1, 'delete_users');

-- Sample categories
INSERT INTO categories (name, alias, status) VALUES 
('Daily News', 'daily-news', 'active'),
('Sports', 'sports', 'active'),
('Business', 'business', 'active');

-- Sample epaper categories
INSERT INTO epaper_categories (title, alias, description, is_active, is_featured, display_order) VALUES 
('Main Edition', 'main-edition', 'Main daily newspaper edition', 1, 1, 1),
('Sports', 'sports', 'Sports news category', 1, 1, 2),
('Business', 'business', 'Business news category', 1, 0, 3),
('Entertainment', 'entertainment', 'Entertainment news category', 1, 0, 4);

-- Sample settings
INSERT INTO settings (key, value, type) VALUES 
('site_title', 'E-Paper CMS', 'text'),
('site_description', 'Digital newspaper management system', 'text'),
('watermark_enabled', '1', 'text'),
('default_timezone', 'UTC', 'text'),
('max_upload_size', '10485760', 'text'),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf', 'text');

-- Sample site settings
INSERT INTO site_settings (setting_key, setting_value, homepage_type) VALUES 
('site_name', 'E-Paper CMS', 'normal'),
('site_tagline', 'Digital Newspaper Management', 'normal'),
('contact_email', 'admin@example.com', 'normal');

-- Sample epaper settings
INSERT INTO epaper_settings (entries_per_page, default_publishing_status) VALUES 
(12, 'publish-immediately');

-- Sample watermark settings
INSERT INTO area_map_watermark_settings (enable_watermarking, opacity, mode, position) VALUES 
(0, 50, 'in_outerside', 'top_center');

-- Complete Layout Templates (7 layouts)
INSERT INTO layouts (name, structure, status, custom_css, custom_js, created_at, updated_at) VALUES 
('Website Homepage', '{"rows": [{"id": "row-1", "columns": [{"id": "col-1", "width": 12, "widgets": [{"id": "widget-1", "type": "heading", "config": {"text": "Welcome to ePaper CMS", "level": 1, "alignment": "center"}}, {"id": "widget-2", "type": "epaper-featured", "config": {"limit": 6, "showTitle": true, "showDate": true}}], "rows": []}]}]}', 'published', '.homepage { background: #f8f9fa; }', '', datetime('now'), datetime('now')),
('Epaper Display', '{"rows": [{"id": "row-1", "columns": [{"id": "col-1", "width": 8, "widgets": [{"id": "widget-1", "type": "epaper-display", "config": {"showNavigation": true, "showZoom": true}}], "rows": []}, {"id": "col-2", "width": 4, "widgets": [{"id": "widget-2", "type": "epaper-thumb-navigation", "config": {"showPageNumbers": true}}, {"id": "widget-3", "type": "epaper-pdf-download", "config": {"buttonText": "Download PDF"}}], "rows": []}]}]}', 'published', '.epaper-display { min-height: 100vh; }', '', datetime('now'), datetime('now')),
('Epaper Archive', '{"rows": [{"id": "row-1", "columns": [{"id": "col-1", "width": 3, "widgets": [{"id": "widget-1", "type": "epaper-calendar", "config": {"showMonthView": true}}], "rows": []}, {"id": "col-2", "width": 9, "widgets": [{"id": "widget-2", "type": "epaper-gallery", "config": {"itemsPerPage": 12, "showPagination": true}}], "rows": []}]}]}', 'published', '.epaper-archive { padding: 20px; }', '', datetime('now'), datetime('now')),
('Epaper Map', '{"rows": [{"id": "row-1", "columns": [{"id": "col-1", "width": 12, "widgets": [{"id": "widget-1", "type": "epaper-area-map", "config": {"showClipDetails": true, "enableSharing": true}}], "rows": []}]}]}', 'published', '.epaper-map { background: white; }', '', datetime('now'), datetime('now')),
('Epaper Clip', '{"rows": [{"id": "row-1", "columns": [{"id": "col-1", "width": 8, "widgets": [{"id": "widget-1", "type": "epaper-clip-display", "config": {"showFullImage": true, "enableZoom": true}}], "rows": []}, {"id": "col-2", "width": 4, "widgets": [{"id": "widget-2", "type": "social-sharing", "config": {"platforms": ["facebook", "twitter", "whatsapp"]}}, {"id": "widget-3", "type": "epaper-clip-share", "config": {"showDownload": true}}], "rows": []}]}]}', 'published', '.epaper-clip { padding: 15px; }', '', datetime('now'), datetime('now')),
('Site Header', '{"rows": [{"id": "row-1", "columns": [{"id": "col-1", "width": 4, "widgets": [{"id": "widget-1", "type": "image", "config": {"src": "/logo.png", "alt": "Site Logo", "width": 200}}], "rows": []}, {"id": "col-2", "width": 8, "widgets": [{"id": "widget-2", "type": "navigation", "config": {"menuLocation": "main-menu", "showSearch": true}}], "rows": []}]}]}', 'published', '.site-header { background: #fff; border-bottom: 1px solid #ddd; padding: 10px 0; }', '', datetime('now'), datetime('now')),
('Site Footer', '{"rows": [{"id": "row-1", "columns": [{"id": "col-1", "width": 4, "widgets": [{"id": "widget-1", "type": "text", "config": {"content": "<h4>About Us</h4><p>Your trusted news source.</p>"}}], "rows": []}, {"id": "col-2", "width": 4, "widgets": [{"id": "widget-2", "type": "menu", "config": {"menuLocation": "footer-menu", "showTitle": "Quick Links"}}], "rows": []}, {"id": "col-3", "width": 4, "widgets": [{"id": "widget-3", "type": "social", "config": {"platforms": ["facebook", "twitter", "instagram"], "showTitle": "Follow Us"}}], "rows": []}]}]}', 'published', '.site-footer { background: #333; color: white; padding: 40px 0 20px; }', '', datetime('now'), datetime('now'));

-- Sample menu
INSERT INTO menus (name, location, alias, status) VALUES 
('Main Menu', 'header', 'main-menu', 'Active');

-- Update site settings with proper layouts
UPDATE site_settings 
SET homepage_layout = 'Website Homepage', site_header_layout = 'Site Header', site_footer_layout = 'Site Footer'
WHERE setting_key = 'site_name';
`;

db.exec(insertSampleData);
console.log('📝 Inserted sample data');

db.close();
console.log('✅ Database setup complete!');
console.log('\n🎉 Features included:');
console.log('   📄 High-quality PDF extraction with GraphicsMagick (300-600 DPI)');
console.log('   🎨 7 complete layout templates');
console.log('   🔐 Admin authentication ready');
console.log('   📊 Analytics and media management');
console.log('\n🚀 Next steps:');
console.log('1. npm install');
console.log('2. npm run dev');
console.log('3. Login with: admin@example.com / admin123 (Super Admin)');
console.log('\n📋 Available layouts:');
console.log('   - Website Homepage');
console.log('   - Epaper Display');
console.log('   - Epaper Archive');
console.log('   - Epaper Map');
console.log('   - Epaper Clip');
console.log('   - Site Header');
console.log('   - Site Footer');