import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/sliders/[id]/slides
 * Fetch all slides for a slider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .eq('slider_id', params.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching slides:', error);
      return NextResponse.json(
        { error: 'Failed to fetch slides' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/sliders/[id]/slides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sliders/[id]/slides
 * Add a new slide to a slider
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { imageUrl, caption, alt, link, position, visible } = body;

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Create slide
    const { data, error } = await supabase
      .from('slides')
      .insert([
        {
          slider_id: params.id,
          image_url: imageUrl,
          caption,
          alt: alt || '',
          link,
          position: position || 0,
          visible: visible !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating slide:', error);
      return NextResponse.json(
        { error: 'Failed to create slide' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sliders/[id]/slides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
