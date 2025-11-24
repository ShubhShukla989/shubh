import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch watermark settings for a category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const categoryId = parseInt(params.id);

    const { data, error } = await supabaseAdmin!
      .from('category_watermark_settings')
      .select('*')
      .eq('category_id', categoryId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default settings if not found
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          category_id: categoryId,
          override_global_settings: false,
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
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching watermark settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST/PUT - Save watermark settings
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const categoryId = parseInt(params.id);
    const body = await request.json();

    // Check if settings already exist
    const { data: existing } = await supabaseAdmin!
      .from('category_watermark_settings')
      .select('id')
      .eq('category_id', categoryId)
      .single();

    let result;
    if (existing) {
      // Update existing settings
      result = await supabaseAdmin!
        .from('category_watermark_settings')
        .update({
          override_global_settings: body.override_global_settings,
          enable_watermarking: body.enable_watermarking,
          logo_url: body.logo_url,
          opacity: body.opacity,
          mode: body.mode,
          position: body.position,
          min_width_px: body.min_width_px,
          background_color: body.background_color,
          foreground_color: body.foreground_color,
          enable_border: body.enable_border,
          border_width: body.border_width,
          border_color: body.border_color,
          info_text: body.info_text,
          info_text_font: body.info_text_font,
          enable_center_watermark: body.enable_center_watermark,
          center_watermark_url: body.center_watermark_url,
          center_watermark_opacity: body.center_watermark_opacity,
        })
        .eq('category_id', categoryId)
        .select()
        .single();
    } else {
      // Insert new settings
      result = await supabaseAdmin!
        .from('category_watermark_settings')
        .insert({
          category_id: categoryId,
          ...body,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error saving watermark settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
