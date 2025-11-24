import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/settings/robots - Get robots.txt content
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'robots_txt')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { content: data?.value || '' },
    });
  } catch (error) {
    console.error('Get robots.txt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch robots.txt' },
      { status: 500 }
    );
  }
}

// POST /api/settings/robots - Save robots.txt content
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'robots_txt',
        value: content || '',
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save robots.txt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save robots.txt' },
      { status: 500 }
    );
  }
}
