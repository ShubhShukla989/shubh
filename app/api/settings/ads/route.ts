import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/settings/ads - Get ads.txt content
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'ads_txt')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { content: data?.value || '' },
    });
  } catch (error) {
    console.error('Get ads.txt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ads.txt' },
      { status: 500 }
    );
  }
}

// POST /api/settings/ads - Save ads.txt content
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'ads_txt',
        value: content || '',
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save ads.txt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save ads.txt' },
      { status: 500 }
    );
  }
}
