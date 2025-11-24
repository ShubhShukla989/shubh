import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('area_map_watermark_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || {
        enable_watermarking: false,
        logo_url: '',
        opacity: 100,
        mode: 'in_outerside',
        position: 'top_center',
        min_width_px: 0,
        background_color: '#ffffff',
        foreground_color: '#000000',
        enable_border: false,
        border_width: 2,
        border_color: '#000000',
        info_text: '',
        info_text_font: 'English',
        enable_center_watermark: false,
        center_watermark_url: '',
        center_watermark_opacity: 100,
      }
    });
  } catch (error: any) {
    console.error('Error fetching watermark settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('area_map_watermark_settings')
      .upsert({
        id: 1,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error saving watermark settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
