const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(process.cwd(), 'database.db');

console.log('🔧 Creating settings tables...');

try {
  const db = new Database(dbPath);
  
  // Create epaper_settings table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS epaper_settings (
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
  `);

  // Create area_map_watermark_settings table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS area_map_watermark_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enable_watermarking INTEGER DEFAULT 0,
      logo_url TEXT,
      area_map_logo_url TEXT,
      clip_logo_url TEXT,
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
  `);

  // Create category_watermark_settings table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS category_watermark_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL UNIQUE,
      override_global_settings INTEGER DEFAULT 0,
      enable_watermarking INTEGER DEFAULT 0,
      logo_url TEXT,
      area_map_logo_url TEXT,
      clip_logo_url TEXT,
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
  `);

  // Add new columns to existing tables if they don't exist
  try {
    db.exec(`ALTER TABLE area_map_watermark_settings ADD COLUMN area_map_logo_url TEXT;`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    db.exec(`ALTER TABLE area_map_watermark_settings ADD COLUMN clip_logo_url TEXT;`);
  } catch (e) {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE category_watermark_settings ADD COLUMN area_map_logo_url TEXT;`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    db.exec(`ALTER TABLE category_watermark_settings ADD COLUMN clip_logo_url TEXT;`);
  } catch (e) {
    // Column already exists
  }

  // Insert default settings if they don't exist
  const epaperExists = db.prepare('SELECT COUNT(*) as count FROM epaper_settings').get();
  if (epaperExists.count === 0) {
    db.exec(`
      INSERT INTO epaper_settings (entries_per_page, default_publishing_status) 
      VALUES (12, 'publish-immediately');
    `);
    console.log('✅ Default epaper settings created');
  }

  const watermarkExists = db.prepare('SELECT COUNT(*) as count FROM area_map_watermark_settings').get();
  if (watermarkExists.count === 0) {
    db.exec(`
      INSERT INTO area_map_watermark_settings (enable_watermarking, opacity) 
      VALUES (0, 100);
    `);
    console.log('✅ Default watermark settings created');
  }

  db.close();
  console.log('✅ Settings tables created successfully!');
  
} catch (error) {
  console.error('❌ Error creating settings tables:', error);
  process.exit(1);
}