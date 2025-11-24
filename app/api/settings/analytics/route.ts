import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/settings/analytics - Get Google Analytics measurement ID
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'analytics_measurement_id')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { measurement_id: data?.value || '' },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/analytics - Save Google Analytics measurement ID
export async function POST(request: NextRequest) {
  try {
    const { measurement_id } = await request.json();

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'analytics_measurement_id',
        value: measurement_id || '',
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save analytics settings' },
      { status: 500 }
    );
  }
}
