import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { areaMapId: string } }
) {
  try {
    const { areaMapId } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('area_maps')
      .select('*')
      .eq('id', areaMapId)
      .single();

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Area map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get area map error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area map' },
      { status: 500 }
    );
  }
}
