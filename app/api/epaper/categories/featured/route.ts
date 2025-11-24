import { NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Featured categories API called');
    const configError = requireSupabaseAdmin();
    if (configError) {
      console.log('Supabase admin config error');
      return configError;
    }

    console.log('Querying featured categories...');
    const { data, error } = await supabaseAdmin!
      .from('epaper_categories')
      .select('*')
      .eq('is_featured', true)
      .order('display_order', { ascending: true });

    console.log('Query result:', { data, error });

    if (error) throw error;

    console.log('Returning data:', data);
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[GET /api/epaper/categories/featured] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured categories' },
      { status: 500 }
    );
  }
}