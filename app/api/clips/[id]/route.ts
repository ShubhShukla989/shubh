import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clipId = params.id;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Fetch clip data from database
    const { data: clip, error } = await supabaseAdmin
      .from('epaper_clips')
      .select('*')
      .eq('id', clipId)
      .single();

    if (error) {
      console.error('Error fetching clip:', error);
      return NextResponse.json(
        { success: false, error: 'Clip not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: clip
    });
  } catch (error) {
    console.error('Error in clips API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
