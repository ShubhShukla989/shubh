import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('epaper_categories')
      .select('*')
      .eq('is_featured', true)
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get featured categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured categories' },
      { status: 500 }
    );
  }
}
