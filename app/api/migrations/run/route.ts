import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // These columns already exist in the PostgreSQL schema.
    // Using IF NOT EXISTS so this is safe to call multiple times.
    await db.execute(sql`
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS title TEXT;
    `);
    await db.execute(sql`
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS alias TEXT;
    `);
    await db.execute(sql`
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    await db.execute(sql`
      ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS category TEXT;
    `);

    await db.execute(sql`
      UPDATE edition_pages
      SET
        title       = COALESCE(title, 'Page ' || page_number::text),
        alias       = COALESCE(alias, 'page-' || page_number::text),
        description = COALESCE(description, ''),
        category    = COALESCE(category, '')
      WHERE title IS NULL OR alias IS NULL OR description IS NULL OR category IS NULL;
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_edition_pages_alias ON edition_pages(alias);
    `);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully.',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run migration: ' + String(error) },
      { status: 500 }
    );
  }
}
