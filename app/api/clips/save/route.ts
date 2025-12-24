import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, category_watermark_settings, area_map_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { applyWatermarkToBase64, WatermarkSettings } from '@/lib/watermark';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_data, edition_id, page_number, category_id, apply_watermark = true } = body;

    if (!image_data || !edition_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let processedImageData = image_data;

    // Apply watermark if requested
    if (apply_watermark) {
      try {
        // Get edition details first (includes category)
        const [edition] = await db
          .select()
          .from(editions)
          .where(eq(editions.id, edition_id))
          .limit(1);

        // Determine which category to use (passed or from edition)
        const effectiveCategoryId = category_id || edition?.category_id;

        // Fetch category-specific or global watermark settings
        let watermarkSettings = null;

        // Try category-specific settings first if category_id available
        if (effectiveCategoryId) {
          const [categorySettings] = await db
            .select()
            .from(category_watermark_settings)
            .where(eq(category_watermark_settings.category_id, effectiveCategoryId))
            .limit(1);

          // Use category settings if override is enabled
          if (categorySettings && categorySettings.override_global_settings) {
            watermarkSettings = categorySettings;
            console.log(`Using category watermark settings for category ${effectiveCategoryId}`);
          }
        }

        // Fallback to global settings if no category override
        if (!watermarkSettings) {
          const [globalSettings] = await db
            .select()
            .from(area_map_watermark_settings)
            .where(eq(area_map_watermark_settings.id, 1))
            .limit(1);
          
          watermarkSettings = globalSettings;
          console.log('Using global watermark settings');
        }

        if (watermarkSettings && watermarkSettings.enable_watermarking) {

          // Generate unique clip ID first for URL
          const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const clipUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/epaper/clip/${clipId}`;

          const context = {
            edition_title: edition?.title || '',
            date: edition?.date || new Date().toISOString().split('T')[0],
            url: clipUrl
          };

          console.log(`✅ Applying watermark for category ${effectiveCategoryId}`);

          // Apply watermark to image (with DBD logo removal)
          processedImageData = await applyWatermarkToBase64(
            image_data,
            watermarkSettings as WatermarkSettings,
            context,
            true // Remove DBD logo first
          );

          // Store with watermarked image
          const clipData = {
            id: clipId,
            image_url: processedImageData,
            clip_url: clipUrl,
            edition_id,
            page_number,
            created_at: new Date().toISOString()
          };

          // Note: epaper_clips table needs to be added to schema
          // For now, just return the clip data without saving
          console.warn('epaper_clips table not in schema - returning clip data without database save');

          return NextResponse.json({
            success: true,
            data: clipData
          });
        } else {
          console.log('⚠️ Watermarking disabled, only removing DBD logo');
          // Even if watermarking is disabled, remove DBD logo
          const { removeDBDLogoFromBase64 } = await import('@/lib/remove-logo');
          processedImageData = await removeDBDLogoFromBase64(image_data);
        }
      } catch (watermarkError) {
        console.error('Watermark application error:', watermarkError);
        // Continue without watermark on error
      }
    }

    // Fallback: save without watermark
    const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const clipUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/epaper/clip/${clipId}`;

    const clipData = {
      id: clipId,
      image_url: processedImageData,
      clip_url: clipUrl,
      edition_id,
      page_number,
      created_at: new Date().toISOString()
    };

    // Note: epaper_clips table needs to be added to schema
    // For now, just return the clip data without saving
    console.warn('epaper_clips table not in schema - returning clip data without database save');

    return NextResponse.json({
      success: true,
      data: clipData
    });
  } catch (error) {
    console.error('Error in save clip API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
