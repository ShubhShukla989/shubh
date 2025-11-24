import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/editions/[id]/area-maps/[areaId]
 * Fetch a single area map by ID with its page information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; areaId: string } }
) {
  try {
    const { areaId } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get the area map
    const { data: areaMap, error: areaError } = await supabaseAdmin
      .from('area_maps')
      .select('*')
      .eq('id', areaId)
      .single();

    if (areaError || !areaMap) {
      console.error('Fetch area map error:', areaError);
      return NextResponse.json(
        { success: false, error: 'Area map not found' },
        { status: 404 }
      );
    }

    // Get the page information
    const { data: page, error: pageError } = await supabaseAdmin
      .from('edition_pages')
      .select('id, page_number, image_url')
      .eq('id', areaMap.page_id)
      .single();

    if (pageError) {
      console.error('Fetch page error:', pageError);
    }

    // Combine area map with page info
    const enrichedAreaMap = {
      ...areaMap,
      page_number: page?.page_number || 0,
      page_image_url: page?.image_url || '',
    };

    return NextResponse.json({ success: true, data: enrichedAreaMap });
  } catch (error) {
    console.error('Get area map error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area map' },
      { status: 500 }
    );
  }
}
