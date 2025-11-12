import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/sliders/alias/[alias]
 * Fetch a slider by alias (for frontend display)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { alias: string } }
) {
  try {
    const { data, error } = await supabase
      .from('sliders')
      .select('*, slides(*)')
      .eq('alias', params.alias)
      .eq('status', 'Active')
      .single();

    if (error) {
      console.error('Error fetching slider by alias:', error);
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }

    // Filter only visible slides and sort by position
    if (data.slides) {
      data.slides = data.slides
        .filter((slide: any) => slide.visible)
        .sort((a: any, b: any) => a.position - b.position);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/sliders/alias/[alias]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
