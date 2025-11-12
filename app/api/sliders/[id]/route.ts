import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/sliders/[id]
 * Fetch a single slider by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('sliders')
      .select('*, slides(*)')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching slider:', error);
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }

    // Sort slides by position
    if (data.slides) {
      data.slides.sort((a: any, b: any) => a.position - b.position);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/sliders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sliders/[id]
 * Update a slider
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, alias, description, status, config } = body;

    const { data, error } = await supabase
      .from('sliders')
      .update({
        title,
        alias,
        description,
        status,
        config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating slider:', error);
      return NextResponse.json(
        { error: 'Failed to update slider' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/sliders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sliders/[id]
 * Delete a slider and all its slides
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete all slides first
    await supabase
      .from('slides')
      .delete()
      .eq('slider_id', params.id);

    // Delete slider
    const { error } = await supabase
      .from('sliders')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting slider:', error);
      return NextResponse.json(
        { error: 'Failed to delete slider' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/sliders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
