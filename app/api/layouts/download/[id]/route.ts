import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

// GET /api/layouts/download/[id] - Download specific backup
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const { data, error } = await supabaseAdmin!
      .from('layout_backups')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Backup not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Return as downloadable JSON
    const filename = `${data.layout_name}-backup-${data.created_at}.json`;
    
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/layouts/download/:id] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}
