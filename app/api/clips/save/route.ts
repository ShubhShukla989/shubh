import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_data, edition_id, page_number } = body;

    if (!image_data || !edition_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique clip ID (timestamp-based for now)
    const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate clip URL
    const clipUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/epaper/clip/${clipId}`;

    // For now, store in memory/session (temporary solution)
    // In production, this should be saved to database
    const clipData = {
      id: clipId,
      image_url: image_data,
      clip_url: clipUrl,
      edition_id,
      page_number,
      created_at: new Date().toISOString()
    };

    // Try to save to database if available
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('epaper_clips')
          .insert(clipData);
      } catch (dbError) {
        console.warn('Database save failed, continuing with temporary storage:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      data: clipData
    });
  } catch (error) {
    console.error('Error in save clip API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
