import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { category_watermark_settings, editions, epaper_categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET - Fetch clip branding settings for a category (via edition)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);

    // First get the edition to find its category
    const [edition] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, editionId))
      .limit(1);

    if (!edition) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    // Get category settings - only if category_id exists
    let categorySettings = null;
    if (edition.category_id) {
      [categorySettings] = await db
        .select()
        .from(category_watermark_settings)
        .where(eq(category_watermark_settings.category_id, edition.category_id))
        .limit(1);
    }

    // Return default settings if not found
    if (!categorySettings) {
      return NextResponse.json({
        success: true,
        data: {
          clip_logo_url: '',
          clip_brand_text: 'दो बजे दोपहर',
          clip_brand_name: 'DBD',
          enable_clip_branding: true,
        },
      });
    }

    // Return only clip-related settings
    return NextResponse.json({
      success: true,
      data: {
        clip_logo_url: categorySettings.clip_logo_url || '',
        clip_brand_text: categorySettings.clip_brand_text || 'दो बजे दोपहर',
        clip_brand_name: categorySettings.clip_brand_name || 'DBD',
        enable_clip_branding: categorySettings.enable_clip_branding ?? true,
      },
    });
  } catch (error) {
    console.error('Error fetching clip settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clip settings' },
      { status: 500 }
    );
  }
}