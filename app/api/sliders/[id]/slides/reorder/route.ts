import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * PUT /api/sliders/[id]/slides/reorder
 * Reorder slides
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'Order must be an array of slide IDs' },
        { status: 400 }
      );
    }

    // Update position for each slide
    const updates = order.map((slideId, index) =>
      supabase
        .from('slides')
        .update({ position: index })
        .eq('id', slideId)
        .eq('slider_id', params.id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/sliders/[id]/slides/reorder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
