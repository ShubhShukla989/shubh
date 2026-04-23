-- ============================================================
-- SQLite Schema Export
-- Database: ./database/epapercms.db
-- Exported: 2026-03-22T16:59:18.416Z
-- Tables: 32
-- ============================================================

CREATE TRIGGER update_area_maps_timestamp 
      AFTER UPDATE ON area_maps
      BEGIN
        UPDATE area_maps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

CREATE TRIGGER update_editions_timestamp 
      AFTER UPDATE ON editions
      BEGIN
        UPDATE editions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

CREATE TRIGGER update_epaper_categories_timestamp 
      AFTER UPDATE ON epaper_categories
      BEGIN
        UPDATE epaper_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

CREATE TRIGGER update_media_files_timestamp 
      AFTER UPDATE ON media_files
      BEGIN
        UPDATE media_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

CREATE TRIGGER update_pages_timestamp 
      AFTER UPDATE ON pages
      BEGIN
        UPDATE pages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

CREATE TRIGGER update_users_timestamp 
      AFTER UPDATE ON users
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

CREATE TABLE active_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  user_ip TEXT,
  current_page TEXT,
  last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
, user_id TEXT);

CREATE TABLE admin_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      updated_by INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
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
, logo_width_percentage INTEGER DEFAULT 50, watermark_version TEXT);

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
, watermarked_image_url TEXT, group_id TEXT, combined_image_url TEXT, watermark_version TEXT, content TEXT);

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

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  alias TEXT,
  status TEXT DEFAULT 'active',
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
, clip_logo_url TEXT, clip_brand_text TEXT DEFAULT "दो बजे दोपहर", clip_brand_name TEXT DEFAULT "DBD", enable_clip_branding INTEGER DEFAULT 1, logo_width_percentage INTEGER DEFAULT 50, watermark_version TEXT);

CREATE TABLE "daily_stats" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      total_views INTEGER DEFAULT 0,
      bounce_rate INTEGER DEFAULT 0,
      avg_session_duration INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    , unique_visitors INTEGER DEFAULT 0);

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

CREATE TABLE epaper_clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      clip_url TEXT NOT NULL,
      edition_id INTEGER NOT NULL,
      page_number INTEGER NOT NULL,
      created_at TEXT NOT NULL
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

CREATE TABLE layout_backups (
  id TEXT PRIMARY KEY,
  layout_name TEXT NOT NULL,
  structure TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE media_file_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_file_id INTEGER,
  media_tag_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE otp_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      blocked_until DATETIME,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , last_attempt TEXT DEFAULT CURRENT_TIMESTAMP);

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
, user_id TEXT);

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

CREATE TABLE password_reset_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    , attempts INTEGER DEFAULT 0, ip_address TEXT, user_agent TEXT, used_at TEXT);

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

CREATE TABLE "roles" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);

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

CREATE TABLE sqlite_sequence(name,seq);

CREATE TABLE sqlite_stat1(tbl,idx,stat);

CREATE TABLE sqlite_stat4(tbl,idx,neq,nlt,ndlt,sample);

CREATE TABLE "users" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fullname` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'Admin',
	`mobile` text,
	`country_code` text,
	`address` text,
	`country` text,
	`state` text,
	`city` text,
	`zip` text,
	`status` text DEFAULT 'Active',
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`role_id` integer DEFAULT 2
);

CREATE INDEX idx_active_sessions_activity 
    ON active_sessions(last_activity)
  ;

CREATE INDEX idx_active_sessions_session_id ON active_sessions(session_id);

CREATE INDEX idx_area_maps_edition_id ON area_maps(edition_id);

CREATE INDEX idx_area_maps_edition_page ON area_maps(edition_id, page_id);

CREATE INDEX idx_area_maps_page_id ON area_maps(page_id);

CREATE INDEX idx_area_maps_watermark_version ON area_maps(watermark_version);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

CREATE INDEX idx_categories_alias ON epaper_categories(alias);

CREATE INDEX idx_categories_featured ON epaper_categories(is_featured);

CREATE INDEX idx_category_watermark_category_id ON category_watermark_settings(category_id);

CREATE INDEX idx_daily_stats_date 
    ON daily_stats(date)
  ;

CREATE INDEX idx_edition_pages_edition_id ON edition_pages(edition_id);

CREATE INDEX idx_editions_alias ON editions(alias);

CREATE INDEX idx_editions_category_id ON editions(category_id);

CREATE INDEX idx_editions_category_status_date ON editions(category_id, status, date DESC);

CREATE INDEX idx_editions_created_at ON editions(created_at);

CREATE INDEX idx_editions_date ON editions(date DESC);

CREATE INDEX idx_editions_featured ON editions(is_featured);

CREATE INDEX idx_editions_status ON editions(status);

CREATE INDEX idx_editions_status_date ON editions(status, date DESC);

CREATE INDEX idx_epaper_categories_active_featured ON epaper_categories(is_active, is_featured, display_order);

CREATE INDEX idx_epaper_categories_alias ON epaper_categories(alias);

CREATE INDEX idx_layouts_name ON layouts(name);

CREATE INDEX idx_media_file_tags_media_file_id ON media_file_tags(media_file_id);

CREATE INDEX idx_media_file_tags_media_tag_id ON media_file_tags(media_tag_id);

CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);

CREATE INDEX idx_menu_items_parent_id ON menu_items(parent_id);

CREATE INDEX idx_menus_alias ON menus(alias);

CREATE INDEX idx_otp_attempts_blocked ON otp_attempts(blocked_until);

CREATE INDEX idx_otp_attempts_email ON otp_attempts(email);

CREATE INDEX idx_otp_attempts_email_ip ON otp_attempts(email, ip_address);

CREATE INDEX idx_page_views_created_at ON page_views(created_at);

CREATE INDEX idx_page_views_date 
    ON page_views(created_at)
  ;

CREATE INDEX idx_page_views_edition_id ON page_views(edition_id);

CREATE INDEX idx_page_views_session 
    ON page_views(session_id, created_at)
  ;

CREATE INDEX idx_page_views_session_id ON page_views(session_id);

CREATE INDEX idx_page_views_user 
    ON page_views(user_id, created_at)
  ;

CREATE INDEX idx_pages_alias ON pages(alias);

CREATE INDEX idx_pages_created_at ON pages(created_at);

CREATE INDEX idx_pageviews_date_user ON page_views(created_at, user_id);

CREATE INDEX idx_pageviews_page_url ON page_views(page_url);

CREATE INDEX idx_password_reset_otps_email ON password_reset_otps(email);

CREATE INDEX idx_password_reset_otps_expires ON password_reset_otps(expires_at);

CREATE INDEX idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

CREATE INDEX idx_password_reset_otps_otp ON password_reset_otps(otp);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);

CREATE INDEX idx_site_settings_key ON site_settings(setting_key);

CREATE INDEX idx_sliders_alias ON sliders(alias);

CREATE INDEX idx_slides_slider_id ON slides(slider_id);

CREATE INDEX idx_users_email ON users(email);

CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);