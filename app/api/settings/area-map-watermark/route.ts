import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_map_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(area_map_watermark_settings)
      .where(eq(area_map_watermark_settings.id, 1))
      .limit(1);

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

    // Check if settings exist
    const [existing] = await db
      .select()
      .from(area_map_watermark_settings)
      .where(eq(area_map_watermark_settings.id, 1))
      .limit(1);

    let data;
    if (existing) {
      [data] = await db
        .update(area_map_watermark_settings)
        .set({
          ...body,
          updated_at: new Date().toISOString()
        })
        .where(eq(area_map_watermark_settings.id, 1))
        .returning();
    } else {
      [data] = await db
        .insert(area_map_watermark_settings)
        .values({
          id: 1,
          ...body
        })
        .returning();
    }

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
