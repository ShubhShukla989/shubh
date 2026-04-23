import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { category_watermark_settings } from '@/lib/schema/settings';
import { eq } from 'drizzle-orm';

// GET /api/settings/category-watermark - Get category watermark settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const [settings] = await db
      .select()
      .from(category_watermark_settings)
      .where(eq(category_watermark_settings.category_id, parseInt(categoryId)));

    if (!settings) {
      return NextResponse.json({ success: true, data: null });
    }

    const responseData = {
      override_global_settings: !!settings.override_global_settings,
      enable_watermarking: !!settings.enable_watermarking,
      logo_url: settings.logo_url || '',
      opacity: settings.opacity || 100, // Don't multiply by 100 here, it's already stored as percentage
      mode: settings.mode || 'in_outerside',
      position: settings.position || 'top_center',
      min_width_px: settings.min_width_px || 0,
      background_color: settings.background_color || '#ffffff',
      foreground_color: settings.foreground_color || '#000000',
      enable_border: !!settings.enable_border,
      border_width: settings.border_width || 2,
      border_color: settings.border_color || '#000000',
      info_text: settings.info_text || '',
      info_text_font: settings.info_text_font || 'English',
      enable_center_watermark: !!settings.enable_center_watermark,
      center_watermark_url: settings.center_watermark_url || '',
      center_watermark_opacity: settings.center_watermark_opacity || 100,
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/category-watermark - Save category watermark settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, regenerate_watermarks, ...settings } = body;
    
    if (!category_id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Generate new watermark version
    const watermarkVersion = new Date().toISOString();

    // Convert frontend format to database format
    const dbSettings = {
      category_id: parseInt(category_id),
      override_global_settings: settings.override_global_settings || false,
      enable_watermarking: settings.enable_watermarking || false,
      logo_url: settings.logo_url || null,
      center_watermark_url: settings.center_watermark_url || null,
      mode: settings.mode || 'in_outerside',
      position: settings.position || 'top_center',
      min_width_px: settings.min_width_px || 0,
      opacity: settings.opacity || 100,
      enable_border: settings.enable_border || false,
      background_color: settings.background_color || '#ffffff',
      foreground_color: settings.foreground_color || '#000000',
      border_width: settings.border_width || 2,
      border_color: settings.border_color || '#000000',
      info_text: settings.info_text || null,
      info_text_font: settings.info_text_font || 'English',
      clip_logo_url: settings.clip_logo_url || null,
      clip_brand_text: settings.clip_brand_text || null,
      clip_brand_name: settings.clip_brand_name || null,
      enable_clip_branding: settings.enable_clip_branding ?? true,
      watermark_version: watermarkVersion,
    };

    // Insert or update settings
    await db
      .insert(category_watermark_settings)
      .values(dbSettings)
      .onConflictDoUpdate({
        target: category_watermark_settings.category_id,
        set: {
          override_global_settings: dbSettings.override_global_settings,
          enable_watermarking: dbSettings.enable_watermarking,
          logo_url: dbSettings.logo_url,
          center_watermark_url: dbSettings.center_watermark_url,
          mode: dbSettings.mode,
          position: dbSettings.position,
          min_width_px: dbSettings.min_width_px,
          opacity: dbSettings.opacity,
          enable_border: dbSettings.enable_border,
          background_color: dbSettings.background_color,
          foreground_color: dbSettings.foreground_color,
          border_width: dbSettings.border_width,
          border_color: dbSettings.border_color,
          info_text: dbSettings.info_text,
          info_text_font: dbSettings.info_text_font,
          clip_logo_url: dbSettings.clip_logo_url,
          clip_brand_text: dbSettings.clip_brand_text,
          clip_brand_name: dbSettings.clip_brand_name,
          enable_clip_branding: dbSettings.enable_clip_branding,
          watermark_version: watermarkVersion,
          updated_at: new Date().toISOString(),
        }
      });

    // ALWAYS invalidate cache when settings change (so new settings apply immediately)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/area-maps/invalidate-cache`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('[category-watermark] Cache invalidation failed:', err);
    }

    // Trigger watermark regeneration if requested
    if (regenerate_watermarks) {
      // Trigger regeneration in background (don't wait for it)
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/area-maps/regenerate-watermarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categoryId: parseInt(category_id), 
          watermarkVersion 
        })
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Settings saved and cache cleared. Watermark regeneration started in background.',
        watermarkVersion,
        cache_invalidated: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved and cache cleared. Next user click will use new settings.',
      watermarkVersion,
      cache_invalidated: true
    });
  } catch (error) {
    console.error('[category-watermark POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings', detail: String(error) },
      { status: 500 }
    );
  }
}