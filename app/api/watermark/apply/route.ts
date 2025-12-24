import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_map_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { applyWatermarkToBase64, WatermarkSettings, WatermarkContext } from '@/lib/watermark';

/**
 * POST /api/watermark/apply
 * Apply watermark to any image
 * 
 * Body:
 * - image_data: base64 image string
 * - context: { edition_title?, date?, url? }
 * - settings: optional custom watermark settings (uses global if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_data, context = {}, settings } = body;

    if (!image_data) {
      return NextResponse.json(
        { success: false, error: 'Missing image_data' },
        { status: 400 }
      );
    }

    let watermarkSettings: WatermarkSettings;

    // Use provided settings or fetch from database
    if (settings) {
      watermarkSettings = settings;
    } else {
      const [data] = await db
        .select()
        .from(area_map_watermark_settings)
        .where(eq(area_map_watermark_settings.id, 1))
        .limit(1);

      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Watermark settings not found' },
          { status: 404 }
        );
      }

      watermarkSettings = data as WatermarkSettings;
    }

    // Check if watermarking is enabled
    if (!watermarkSettings.enable_watermarking) {
      return NextResponse.json({
        success: true,
        data: { image_data, watermark_applied: false }
      });
    }

    // Apply watermark
    const watermarkedImage = await applyWatermarkToBase64(
      image_data,
      watermarkSettings,
      context as WatermarkContext
    );

    return NextResponse.json({
      success: true,
      data: {
        image_data: watermarkedImage,
        watermark_applied: true
      }
    });
  } catch (error) {
    console.error('Error applying watermark:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply watermark' },
      { status: 500 }
    );
  }
}
