import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const { id, pageId } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('area_maps')
      .select('*')
      .eq('page_id', pageId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get area maps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area maps' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const { id, pageId } = params;
    const body = await request.json();
    const { areaMaps } = body;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Delete existing area maps for this page
    await supabaseAdmin
      .from('area_maps')
      .delete()
      .eq('page_id', pageId);

    // Insert new area maps
    if (areaMaps && areaMaps.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('area_maps')
        .insert(
          areaMaps.map((area: any) => ({
            page_id: parseInt(pageId),
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
            title: area.title,
            url: area.url,
          }))
        );

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Area maps saved successfully',
    });
  } catch (error) {
    console.error('Save area maps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save area maps' },
      { status: 500 }
    );
  }
}
