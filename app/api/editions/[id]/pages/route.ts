import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('[GET /api/editions/[id]/pages] Edition ID:', id);

    if (!supabaseAdmin) {
      console.log('[GET /api/editions/[id]/pages] ERROR: Database not configured');
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Fetch pages
    const { data: pages, error } = await supabaseAdmin
      .from('edition_pages')
      .select('*')
      .eq('edition_id', id)
      .order('page_number', { ascending: true });

    console.log('[GET /api/editions/[id]/pages] Query result:', { 
      pagesCount: pages?.length || 0, 
      error: error?.message,
      firstPage: pages?.[0]
    });

    if (error) {
      console.log('[GET /api/editions/[id]/pages] ERROR:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Fetch area maps for all pages
    if (pages && pages.length > 0) {
      const pageIds = pages.map(p => p.id);
      
      const { data: areaMaps, error: areaMapsError } = await supabaseAdmin
        .from('area_maps')
        .select('*')
        .in('page_id', pageIds);

      if (!areaMapsError && areaMaps) {
        // Group area maps by page_id
        const areaMapsByPage: Record<number, any[]> = {};
        areaMaps.forEach(am => {
          if (!areaMapsByPage[am.page_id]) {
            areaMapsByPage[am.page_id] = [];
          }
          areaMapsByPage[am.page_id].push(am);
        });

        // Add area_map_config to each page
        pages.forEach(page => {
          const pageMaps = areaMapsByPage[page.id] || [];
          if (pageMaps.length > 0) {
            page.area_map_config = {
              areas: pageMaps.map(am => ({
                coords: `${am.x},${am.y},${am.x + am.width},${am.y + am.height}`,
                shape: 'rect' as const,
                linkedPageNumber: am.linked_page_number,
                linked_page_number: am.linked_page_number // Support both formats
              }))
            };
          }
        });
      }
    }

    console.log('[GET /api/editions/[id]/pages] Returning response with', pages?.length || 0, 'pages');
    return NextResponse.json({ success: true, data: pages || [] });
  } catch (error) {
    console.error('[GET /api/editions/[id]/pages] Catch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}
