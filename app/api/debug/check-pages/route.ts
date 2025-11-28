import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check edition 76 pages
    const { data: pages, error } = await supabaseAdmin
      .from('edition_pages')
      .select('*')
      .eq('edition_id', 76)
      .order('page_number', { ascending: true });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      message: `Found ${pages?.length || 0} pages for edition 76`,
      pages: pages,
      columns: pages && pages.length > 0 ? Object.keys(pages[0]) : []
    });
  } catch (error) {
    console.error('Check pages error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
