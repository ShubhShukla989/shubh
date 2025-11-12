import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * PUT /api/sliders/[id]/slides/[slideId]
 * Update a slide
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; slideId: string } }
) {
  try {
    const body = await request.json();
    const { imageUrl, caption, alt, link, position, visible } = body;

    const { data, error } = await supabase
      .from('slides')
      .update({
        image_url: imageUrl,
        caption,
        alt,
        link,
        position,
        visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.slideId)
      .eq('slider_id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating slide:', error);
      return NextResponse.json(
        { error: 'Failed to update slide' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/sliders/[id]/slides/[slideId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sliders/[id]/slides/[slideId]
 * Delete a slide
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; slideId: string } }
) {
  try {
    const { error } = await supabase
      .from('slides')
      .delete()
      .eq('id', params.slideId)
      .eq('slider_id', params.id);

    if (error) {
      console.error('Error deleting slide:', error);
      return NextResponse.json(
        { error: 'Failed to delete slide' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/sliders/[id]/slides/[slideId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
