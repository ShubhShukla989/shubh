const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(process.cwd(), 'database.db');

console.log('🔧 Fixing watermark tables...');

try {
  const db = new Database(dbPath);
  
  // Check if category_watermark_settings table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='category_watermark_settings'
  `).get();

  if (!tableExists) {
    console.log('📋 Creating category_watermark_settings table...');
    // Create the table from scratch
    db.exec(`
      CREATE TABLE category_watermark_settings (
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
    console.log('✅ category_watermark_settings table created');
  } else {
    console.log('📋 category_watermark_settings table exists, checking columns...');
    
    // Check if area_map_logo_url column exists
    const columns = db.prepare(`PRAGMA table_info(category_watermark_settings)`).all();
    const hasAreaMapLogoUrl = columns.some(col => col.name === 'area_map_logo_url');
    const hasClipLogoUrl = columns.some(col => col.name === 'clip_logo_url');
    
    if (!hasAreaMapLogoUrl) {
      console.log('➕ Adding area_map_logo_url column...');
      db.exec(`ALTER TABLE category_watermark_settings ADD COLUMN area_map_logo_url TEXT;`);
      console.log('✅ area_map_logo_url column added');
    }
    
    if (!hasClipLogoUrl) {
      console.log('➕ Adding clip_logo_url column...');
      db.exec(`ALTER TABLE category_watermark_settings ADD COLUMN clip_logo_url TEXT;`);
      console.log('✅ clip_logo_url column added');
    }
  }

  // Also check area_map_watermark_settings table
  const areaMapTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='area_map_watermark_settings'
  `).get();

  if (!areaMapTableExists) {
    console.log('📋 Creating area_map_watermark_settings table...');
    db.exec(`
      CREATE TABLE area_map_watermark_settings (
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
    
    // Insert default settings
    db.exec(`
      INSERT INTO area_map_watermark_settings (enable_watermarking, opacity) 
      VALUES (0, 100);
    `);
    console.log('✅ area_map_watermark_settings table created with default settings');
  } else {
    console.log('📋 area_map_watermark_settings table exists, checking columns...');
    
    const areaMapColumns = db.prepare(`PRAGMA table_info(area_map_watermark_settings)`).all();
    const hasAreaMapLogoUrl = areaMapColumns.some(col => col.name === 'area_map_logo_url');
    const hasClipLogoUrl = areaMapColumns.some(col => col.name === 'clip_logo_url');
    
    if (!hasAreaMapLogoUrl) {
      console.log('➕ Adding area_map_logo_url column to area_map_watermark_settings...');
      db.exec(`ALTER TABLE area_map_watermark_settings ADD COLUMN area_map_logo_url TEXT;`);
      console.log('✅ area_map_logo_url column added to area_map_watermark_settings');
    }
    
    if (!hasClipLogoUrl) {
      console.log('➕ Adding clip_logo_url column to area_map_watermark_settings...');
      db.exec(`ALTER TABLE area_map_watermark_settings ADD COLUMN clip_logo_url TEXT;`);
      console.log('✅ clip_logo_url column added to area_map_watermark_settings');
    }
  }

  db.close();
  console.log('✅ Watermark tables fixed successfully!');
  
} catch (error) {
  console.error('❌ Error fixing watermark tables:', error);
  process.exit(1);
}