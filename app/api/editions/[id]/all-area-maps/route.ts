import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/editions/[id]/all-area-maps
 * Fetch all area maps for an edition (across all pages)
 * Used for linking area maps together
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get all pages for this edition
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('edition_pages')
      .select('id, page_number')
      .eq('edition_id', id)
      .order('page_number', { ascending: true });

    if (pagesError) {
      console.error('Fetch pages error:', pagesError);
      return NextResponse.json(
        { success: false, error: pagesError.message },
        { status: 500 }
      );
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const pageIds = pages.map(p => p.id);
    console.log('Edition pages:', pages.length, 'Page IDs:', pageIds);

    // Get all area maps for these pages
    // Note: Supabase has a default limit, so we need to explicitly set a higher limit
    const { data: areaMaps, error: areaMapsError } = await supabaseAdmin
      .from('area_maps')
      .select('id, page_id, title, x, y, width, height')
      .in('page_id', pageIds)
      .order('page_id', { ascending: true })
      .order('id', { ascending: true })
      .limit(1000); // Fetch up to 1000 area maps

    console.log('Found area maps:', areaMaps?.length, 'Error:', areaMapsError);

    if (areaMapsError) {
      console.error('Fetch area maps error:', areaMapsError);
      return NextResponse.json(
        { success: false, error: areaMapsError.message },
        { status: 500 }
      );
    }

    // Enrich with page numbers
    const enrichedAreaMaps = (areaMaps || []).map(area => {
      const page = pages.find(p => p.id === area.page_id);
      return {
        id: area.id,
        page_id: area.page_id,
        title: area.title,
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        page_number: page?.page_number || 0,
      };
    });

    const response = NextResponse.json({ success: true, data: enrichedAreaMaps });
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Get all area maps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area maps' },
      { status: 500 }
    );
  }
}
