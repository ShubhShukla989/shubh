import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

// POST /api/layouts/update - Save or publish layout
export async function POST(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const body = await request.json();
    const { name, structure, custom_css, custom_js, status } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Layout name is required' },
        { status: 400 }
      );
    }

    // Upsert layout (insert or update)
    const { data, error } = await supabaseAdmin!
      .from('layouts')
      .upsert(
        {
          name,
          structure: structure || { rows: [] },
          custom_css: custom_css || '',
          custom_js: custom_js || '',
          status: status || 'draft',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'name',
        }
      )
      .select()
      .single();

    if (error) throw error;

    // If publishing, create a backup
    if (status === 'published') {
      await supabaseAdmin!.from('layout_backups').insert({
        layout_name: name,
        structure,
        custom_css,
        custom_js,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[POST /api/layouts/update] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layout' },
      { status: 500 }
    );
  }
}
