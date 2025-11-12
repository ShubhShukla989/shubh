import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

// POST /api/layouts/backup - Create backup of current layouts
export async function POST(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const body = await request.json();
    const { layout_name, structure, custom_css, custom_js } = body;

    if (!layout_name) {
      return NextResponse.json(
        { success: false, error: 'Layout name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin!
      .from('layout_backups')
      .insert({
        layout_name,
        structure,
        custom_css: custom_css || '',
        custom_js: custom_js || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[POST /api/layouts/backup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// GET /api/layouts/backup - Get all backups
export async function GET(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const { searchParams } = new URL(request.url);
    const layoutName = searchParams.get('layout_name');

    let query = supabaseAdmin!
      .from('layout_backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (layoutName) {
      query = query.eq('layout_name', layoutName);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/layouts/backup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}
