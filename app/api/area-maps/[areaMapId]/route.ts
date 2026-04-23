import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps, editions, category_watermark_settings, area_map_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { applyWatermarkToBase64, WatermarkSettings } from '@/lib/watermark';

// Disable Next.js caching for area maps - use short cache for CDN
export const dynamic = 'force-dynamic';
export const revalidate = 180; // 3 minutes cache

export async function GET(
  request: NextRequest,
  { params }: { params: { areaMapId: string } }
) {
  try {
    const { areaMapId } = params;

    const [data] = await db
      .select()
      .from(area_maps)
      .where(eq(area_maps.id, parseInt(areaMapId)))
      .limit(1);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Area map not found' },
        { status: 404 }
      );
    }

    // Parse linked_area_ids from JSON string to array
    const parsedData = {
      ...data,
      linked_area_ids: data.linked_area_ids 
        ? JSON.parse(data.linked_area_ids) 
        : []
    };

    // Return with watermarked_image_url if available (instant load!)
    // Add short cache headers so updates propagate within 3 minutes
    return NextResponse.json({ success: true, data: parsedData }, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=180',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area map' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/area-maps/[areaMapId]
 * Save pre-generated watermarked image for instant load
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { areaMapId: string } }
) {
  try {
    const { areaMapId } = params;
    const body = await request.json();
    const { watermarked_image_url } = body;

    if (!watermarked_image_url) {
      return NextResponse.json(
        { success: false, error: 'watermarked_image_url is required' },
        { status: 400 }
      );
    }

    // Update area map with watermarked image
    const [updated] = await db
      .update(area_maps)
      .set({
        watermarked_image_url,
        updated_at: new Date().toISOString()
      })
      .where(eq(area_maps.id, parseInt(areaMapId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Area map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Watermarked image saved successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save watermarked image' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/area-maps/[areaMapId]
 * Regenerate area map with updated watermark settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { areaMapId: string } }
) {
  try {
    const { areaMapId } = params;
    const body = await request.json();
    const { regenerate_watermark = false } = body;

    // Fetch existing area map
    const [areaMap] = await db
      .select()
      .from(area_maps)
      .where(eq(area_maps.id, parseInt(areaMapId)))
      .limit(1);

    if (!areaMap) {
      return NextResponse.json(
        { success: false, error: 'Area map not found' },
        { status: 404 }
      );
    }

    // If regenerate watermark requested
    /* Disabled - area_maps don't have image_url field
    if (regenerate_watermark && areaMap.edition_id) {
      try {
        // Get edition details
        const editionId = areaMap.edition_id as number;
        const [edition] = await db
          .select()
          .from(editions)
          .where(eq(editions.id, editionId))
          .limit(1);

        // Fetch watermark settings
        let watermarkSettings = null;

        if (edition?.category_id) {
          const categoryId = edition.category_id as number;
          const [categorySettings] = await db
            .select()
            .from(category_watermark_settings)
            .where(eq(category_watermark_settings.category_id, categoryId))
            .limit(1);

          if (categorySettings && categorySettings.override_global_settings) {
            watermarkSettings = categorySettings;
          }
        }

        if (!watermarkSettings) {
          const [globalSettings] = await db
            .select()
            .from(area_map_watermark_settings)
            .where(eq(area_map_watermark_settings.id, 1))
            .limit(1);
          
          watermarkSettings = globalSettings;
        }

        // Apply watermark to image
        if (watermarkSettings && watermarkSettings.enable_watermarking) {
          const context = {
            edition_title: edition?.title || '',
            date: edition?.date?.toString() || new Date().toISOString().split('T')[0],
            url: (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/^https?:\/\//, '')
          };
          
          const watermarkedImage = await applyWatermarkToBase64(
            areaMap.image_url || '',
            watermarkSettings as WatermarkSettings,
            context,
            true // Remove DBD logo first
          );

          // Update area map with new watermarked image
          const [updated] = await db
            .update(area_maps)
            .set({
              image_url: watermarkedImage,
              updated_at: new Date().toISOString()
            })
            .where(eq(area_maps.id, parseInt(areaMapId)))
            .returning();

          return NextResponse.json({
            success: true,
            data: updated,
            message: 'Watermark regenerated successfully'
          }, {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Watermarking is not enabled'
          }, { status: 400 });
        }
      } catch (watermarkError) {
        return NextResponse.json(
          { success: false, error: 'Failed to regenerate watermark' },
          { status: 500 }
        );
      }
    }
    */

    return NextResponse.json({
      success: false,
      error: 'Watermark regeneration not supported for area_maps - use edition_pages instead'
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update area map' },
      { status: 500 }
    );
  }
}
