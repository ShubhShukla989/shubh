const Database = require('better-sqlite3');
const path = require('path');

function addDatabaseIndexes() {
  const db = new Database(path.join(process.cwd(), 'database', 'epapercms.db'));
  
  console.log('🚀 Adding Database Indexes...\n');
  
  const indexes = [
    // Editions table indexes
    {
      name: 'idx_editions_date',
      table: 'editions',
      columns: ['date'],
      description: 'Fast date-based queries for editions'
    },
    {
      name: 'idx_editions_category_date',
      table: 'editions',
      columns: ['category_id', 'date'],
      description: 'Category + date composite index'
    },
    {
      name: 'idx_editions_status_date',
      table: 'editions',
      columns: ['status', 'date'],
      description: 'Published editions by date'
    },
    {
      name: 'idx_editions_featured',
      table: 'editions',
      columns: ['is_featured', 'date'],
      description: 'Featured editions by date'
    },
    
    // Edition pages table indexes
    {
      name: 'idx_edition_pages_edition',
      table: 'edition_pages',
      columns: ['edition_id', 'page_number'],
      description: 'Fast page lookup by edition'
    },
    {
      name: 'idx_edition_pages_category',
      table: 'edition_pages',
      columns: ['page_category_id'],
      description: 'Pages by category'
    },
    
    // Area maps table indexes
    {
      name: 'idx_area_maps_page',
      table: 'area_maps',
      columns: ['page_id'],
      description: 'Area maps by page'
    },
    {
      name: 'idx_area_maps_edition',
      table: 'area_maps',
      columns: ['edition_id'],
      description: 'Area maps by edition'
    },
    
    // Epaper categories table indexes (already has alias index)
    {
      name: 'idx_epaper_categories_parent',
      table: 'epaper_categories',
      columns: ['parent_id'],
      description: 'Subcategory lookup'
    },
    {
      name: 'idx_epaper_categories_featured',
      table: 'epaper_categories',
      columns: ['is_featured', 'display_order'],
      description: 'Featured categories ordering'
    },
    {
      name: 'idx_epaper_categories_active',
      table: 'epaper_categories',
      columns: ['is_active', 'display_order'],
      description: 'Active categories ordering'
    },
    
    // Media files indexes
    {
      name: 'idx_media_files_filename',
      table: 'media_files',
      columns: ['filename'],
      description: 'Fast file lookup by filename'
    },
    {
      name: 'idx_media_files_mime_type',
      table: 'media_files',
      columns: ['mime_type'],
      description: 'Files by type'
    },
    {
      name: 'idx_media_files_created',
      table: 'media_files',
      columns: ['created_at'],
      description: 'Files by creation date'
    },
    
    // Page views analytics indexes
    {
      name: 'idx_page_views_edition',
      table: 'page_views',
      columns: ['edition_id', 'created_at'],
      description: 'Page views by edition and date'
    },
    {
      name: 'idx_page_views_session',
      table: 'page_views',
      columns: ['session_id'],
      description: 'Page views by session'
    },
    {
      name: 'idx_page_views_date',
      table: 'page_views',
      columns: ['created_at'],
      description: 'Page views by date for analytics'
    },
    
    // Daily stats indexes
    {
      name: 'idx_daily_stats_date_range',
      table: 'daily_stats',
      columns: ['date'],
      description: 'Daily stats date range queries'
    },
    
    // Menu items indexes
    {
      name: 'idx_menu_items_menu',
      table: 'menu_items',
      columns: ['menu_id', 'position'],
      description: 'Menu items by menu and position'
    },
    {
      name: 'idx_menu_items_parent',
      table: 'menu_items',
      columns: ['parent_id'],
      description: 'Submenu items lookup'
    },
    
    // Slides indexes
    {
      name: 'idx_slides_slider',
      table: 'slides',
      columns: ['slider_id', 'position'],
      description: 'Slides by slider and position'
    },
    {
      name: 'idx_slides_visible',
      table: 'slides',
      columns: ['visible', 'position'],
      description: 'Visible slides ordering'
    },
    
    // Media file tags indexes
    {
      name: 'idx_media_file_tags_file',
      table: 'media_file_tags',
      columns: ['media_file_id'],
      description: 'Tags by media file'
    },
    {
      name: 'idx_media_file_tags_tag',
      table: 'media_file_tags',
      columns: ['media_tag_id'],
      description: 'Files by tag'
    },
    
    // Role permissions indexes
    {
      name: 'idx_role_permissions_role',
      table: 'role_permissions',
      columns: ['role_id'],
      description: 'Permissions by role'
    },
    {
      name: 'idx_role_permissions_permission',
      table: 'role_permissions',
      columns: ['permission_key'],
      description: 'Roles by permission'
    },
    
    // Active sessions indexes
    {
      name: 'idx_active_sessions_activity',
      table: 'active_sessions',
      columns: ['last_activity'],
      description: 'Sessions by last activity for cleanup'
    },
    
    // Audit logs indexes
    {
      name: 'idx_audit_logs_user',
      table: 'audit_logs',
      columns: ['user_id', 'created_at'],
      description: 'Audit logs by user and date'
    },
    {
      name: 'idx_audit_logs_entity',
      table: 'audit_logs',
      columns: ['entity_type', 'entity_id'],
      description: 'Audit logs by entity'
    },
    {
      name: 'idx_audit_logs_date',
      table: 'audit_logs',
      columns: ['created_at'],
      description: 'Audit logs by date'
    }
  ];
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  indexes.forEach(index => {
    try {
      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(index.table);
      
      if (!tableExists) {
        console.log(`⚠️  Table ${index.table} not found, skipping ${index.name}`);
        skipped++;
        return;
      }
      
      // Check if index already exists
      const indexExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name=?
      `).get(index.name);
      
      if (indexExists) {
        console.log(`✅ Index ${index.name} already exists`);
        skipped++;
        return;
      }
      
      // Create index
      const sql = `CREATE INDEX ${index.name} ON ${index.table} (${index.columns.join(', ')})`;
      db.prepare(sql).run();
      
      console.log(`✅ Created index: ${index.name}`);
      console.log(`   Description: ${index.description}`);
      console.log(`   SQL: ${sql}\n`);
      created++;
      
    } catch (error) {
      console.log(`❌ Failed to create index ${index.name}: ${error.message}`);
      errors++;
    }
  });
  
  console.log(`\n🎉 Database indexing complete!`);
  console.log(`📊 Summary:`);
  console.log(`   ✅ Created: ${created} indexes`);
  console.log(`   ⚠️  Skipped: ${skipped} indexes`);
  console.log(`   ❌ Errors: ${errors} indexes`);
  
  // Optimize database after adding indexes
  console.log(`\n🔧 Optimizing database...`);
  try {
    db.prepare('PRAGMA optimize').run();
    console.log(`✅ Database optimization complete`);
  } catch (error) {
    console.log(`❌ Database optimization failed: ${error.message}`);
  }
  
  db.close();
}

if (require.main === module) {
  addDatabaseIndexes();
}

module.exports = { addDatabaseIndexes };