import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const { searchParams } = new URL(request.url);
    const searchBy = searchParams.get('searchBy') || 'title';
    const query = searchParams.get('query');

    // Fetch all media files from database
    let dbQuery = supabaseAdmin!
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (query) {
      if (searchBy === 'title') {
        dbQuery = dbQuery.ilike('title', `%${query}%`);
      } else if (searchBy === 'filename') {
        dbQuery = dbQuery.ilike('filename', `%${query}%`);
      }
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch media' },
        { status: 500 }
      );
    }

    // Map database fields to expected format
    const mappedData = (data || []).map((file: any) => ({
      id: file.id,
      url: file.file_url,
      name: file.filename,
      title: file.title,
      alt_text: file.alt_text,
      size: file.file_size,
      type: file.mime_type,
      createdAt: file.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: mappedData,
    });
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
