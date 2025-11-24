import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/layouts/[name]/pages
 * Get all pages that use this layout
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;

    // Get all pages
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, alias, content, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pages:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Filter pages that use this layout
    const connectedPages = (pages || []).filter(page => {
      try {
        const content = JSON.parse(page.content || '{}');
        return content.mode === 'designer' && content.layoutName === name;
      } catch (e) {
        return false;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        layoutName: name,
        totalPages: connectedPages.length,
        pages: connectedPages.map(p => ({
          id: p.id,
          title: p.title,
          alias: p.alias,
          status: p.status,
          created_at: p.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get layout pages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connected pages' },
      { status: 500 }
    );
  }
}
