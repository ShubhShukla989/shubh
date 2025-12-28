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
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
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
        }
      });
    }

    const responseData = {
      override_global_settings: !!settings.override_global_settings,
      enable_watermarking: !!settings.enable_watermarking,
      logo_url: settings.logo_url || '',
      opacity: settings.opacity ? Math.round(settings.opacity * 100) : 100,
      mode: 'in_outerside',
      position: settings.position || 'top_center',
      min_width_px: 0,
      background_color: settings.background_color || '#ffffff',
      foreground_color: settings.foreground_color || '#000000',
      enable_border: !!settings.enable_border,
      border_width: settings.border_width || 2,
      border_color: settings.border_color || '#000000',
      info_text: settings.info_text || '',
      info_text_font: settings.info_text_font || 'English',
      enable_center_watermark: !!settings.center_watermark_url,
      center_watermark_url: settings.center_watermark_url || '',
      center_watermark_opacity: settings.center_watermark_opacity || 100,
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ API: Error fetching category watermark settings:', error);
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
    const { category_id, ...settings } = body;
    
    if (!category_id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Convert frontend format to database format
    const dbSettings = {
      category_id: parseInt(category_id),
      override_global_settings: settings.override_global_settings || false,
      enable_watermarking: settings.enable_watermarking || false,
      logo_url: settings.logo_url || null,
      center_watermark_url: settings.center_watermark_url || null,
      position: settings.position || 'center',
      opacity: settings.opacity || 100,
      enable_border: settings.enable_border || false,
      background_color: settings.background_color || '#ffffff',
      foreground_color: settings.foreground_color || '#000000',
      border_width: settings.border_width || 2,
      border_color: settings.border_color || '#000000',
      info_text: settings.info_text || null,
      info_text_font: settings.info_text_font || 'English',
    };

    // Insert or update settings
    const result = await db
      .insert(category_watermark_settings)
      .values(dbSettings)
      .onConflictDoUpdate({
        target: category_watermark_settings.category_id,
        set: {
          override_global_settings: dbSettings.override_global_settings,
          enable_watermarking: dbSettings.enable_watermarking,
          logo_url: dbSettings.logo_url,
          center_watermark_url: dbSettings.center_watermark_url,
          position: dbSettings.position,
          opacity: dbSettings.opacity,
          enable_border: dbSettings.enable_border,
          background_color: dbSettings.background_color,
          foreground_color: dbSettings.foreground_color,
          border_width: dbSettings.border_width,
          border_color: dbSettings.border_color,
          info_text: dbSettings.info_text,
          info_text_font: dbSettings.info_text_font,
          updated_at: new Date().toISOString(),
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('❌ API: Error saving category watermark settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}