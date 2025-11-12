import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

// GET /api/layouts/[name] - Fetch latest published layout by name
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const layoutName = params.name;

    const { data, error } = await supabaseAdmin!
      .from('layouts')
      .select('*')
      .eq('name', layoutName)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Layout not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/layouts/:name] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layout' },
      { status: 500 }
    );
  }
}
