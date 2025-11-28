import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Run migration to add columns using raw SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS title TEXT;
        ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS alias TEXT;
        ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE edition_pages ADD COLUMN IF NOT EXISTS category TEXT;
        
        UPDATE edition_pages 
        SET 
          title = COALESCE(title, 'Page ' || page_number),
          alias = COALESCE(alias, 'page-' || page_number),
          description = COALESCE(description, ''),
          category = COALESCE(category, '')
        WHERE title IS NULL OR alias IS NULL OR description IS NULL OR category IS NULL;
        
        CREATE INDEX IF NOT EXISTS idx_edition_pages_alias ON edition_pages(alias);
      `,
    });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

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
