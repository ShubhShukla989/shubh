import { db } from '@/lib/db';
import { category_watermark_settings, area_map_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { WatermarkSettings } from '@/lib/watermark';

/**
 * Fetch watermark settings for a specific category
 * Falls back to global settings if category doesn't have override
 */
export async function getWatermarkSettings(categoryId?: string | number): Promise<WatermarkSettings | null> {
  try {
    // If category ID provided, try to fetch category-specific settings
    if (categoryId) {
      const [categorySettings] = await db
        .select()
        .from(category_watermark_settings)
        .where(eq(category_watermark_settings.category_id, Number(categoryId)))
        .limit(1);

      // If category has override settings, return them
      if (categorySettings && categorySettings.override_global_settings) {
        return categorySettings as WatermarkSettings;
      }
    }

    // Fetch global settings
    const [globalSettings] = await db
      .select()
      .from(area_map_watermark_settings)
      .where(eq(area_map_watermark_settings.id, 1))
      .limit(1);

    return globalSettings as WatermarkSettings;
  } catch (error) {
    console.error('Error fetching watermark settings:', error);
    return null;
  }
}

/**
 * Get default watermark settings
 */
export function getDefaultWatermarkSettings(): WatermarkSettings {
  return {
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
  };
}
