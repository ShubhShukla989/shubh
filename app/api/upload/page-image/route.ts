import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json(
        { success: false, error: 'File and path are required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using supabaseAdmin (bypasses RLS)
    const { data, error } = await supabaseAdmin!.storage
      .from('page-assets')
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('[Upload Page Image] Storage error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin!.storage
      .from('page-assets')
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
      },
    });
  } catch (error) {
    console.error('[POST /api/upload/page-image] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
