import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export async function POST() {
  try {
    // Use raw SQLite for migrations
    const sqlite = new Database(process.env.DATABASE_URL!.replace('file:', ''));
    
    // Run migration to add columns using raw SQL
    sqlite.exec(`
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS title TEXT;
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS alias TEXT;
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS category TEXT;
    `);

    sqlite.exec(`
      UPDATE edition_pages 
      SET 
        title = COALESCE(title, 'Page ' || page_number),
        alias = COALESCE(alias, 'page-' || page_number),
        description = COALESCE(description, ''),
        category = COALESCE(category, '')
      WHERE title IS NULL OR alias IS NULL OR description IS NULL OR category IS NULL;
    `);

    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_edition_pages_alias ON edition_pages(alias);
    `);
    
    sqlite.close();

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully! Columns added to edition_pages table.',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run migration: ' + String(error) },
      { status: 500 }
    );
  }
}
