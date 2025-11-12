import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/media/create-record
 * Create a database record for an existing storage file
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { filename, url, size, type } = body;

    if (!filename || !url) {
      return NextResponse.json(
        { success: false, error: 'Filename and URL are required' },
        { status: 400 }
      );
    }

    // Check if record already exists
    const { data: existing } = await supabaseAdmin
      .from('media_files')
      .select('id')
      .eq('filename', filename)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Record already exists',
      });
    }

    // Create new record
    const { data, error } = await supabaseAdmin
      .from('media_files')
      .insert({
        filename,
        original_name: filename,
        file_path: `media/${filename}`,
        file_url: url,
        file_size: size || 0,
        mime_type: type || 'image/*',
        title: filename,
        alt_text: '',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Media record created successfully',
    });
  } catch (error: any) {
    console.error('Create record error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create record' },
      { status: 500 }
    );
  }
}
