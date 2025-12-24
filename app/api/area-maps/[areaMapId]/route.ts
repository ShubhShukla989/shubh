import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps, editions, category_watermark_settings, area_map_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { applyWatermarkToBase64, WatermarkSettings } from '@/lib/watermark';

export async function GET(
  request: NextRequest,
  { params }: { params: { areaMapId: string } }
) {
  try {
    const { areaMapId } = params;
    const { searchParams } = new URL(request.url);
    const applyWatermark = searchParams.get('watermark') === 'true';

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

    // Note: Watermarking logic removed - area_maps don't have image_url field
    // Watermarking should be done on edition_pages instead
    /* Disabled watermark logic - area_maps table doesn't have image_url
    if (false && applyWatermark && data.edition_id) {
      try {
        // Get edition details first (includes category)
        const editionId = data.edition_id as number;
        const [edition] = await db
          .select()
          .from(editions)
          .where(eq(editions.id, editionId))
          .limit(1);

        // Fetch category-specific or global watermark settings
        let watermarkSettings = null;

        // Try category-specific settings first if category_id available
        if (edition?.category_id) {
          const categoryId = edition.category_id as number;
          const [categorySettings] = await db
            .select()
            .from(category_watermark_settings)
            .where(eq(category_watermark_settings.category_id, categoryId))
            .limit(1);

          // Use category settings if override is enabled
          if (categorySettings && categorySettings.override_global_settings) {
            watermarkSettings = categorySettings;
            console.log(`Using category watermark settings for category ${edition.category_id}`);
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
          const context = {
            edition_title: edition?.title || '',
            date: edition?.date || new Date().toISOString().split('T')[0],
            url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/area-map/${areaMapId}`
          };

          console.log(`✅ Applying watermark for category ${edition?.category_id}`);
          
          // Apply watermark to image (with DBD logo removal)
          data.image_url = await applyWatermarkToBase64(
            data.image_url,
            watermarkSettings as WatermarkSettings,
            context,
            true // Remove DBD logo first
          );
        } else {
          console.log('⚠️ Watermarking disabled, only removing DBD logo');
          // Even if watermarking is disabled, remove DBD logo
          const { removeDBDLogoFromBase64 } = await import('@/lib/remove-logo');
          data.image_url = await removeDBDLogoFromBase64(data.image_url);
        }
      } catch (watermarkError) {
        console.error('Watermark application error:', watermarkError);
        // Continue without watermark on error
      }
    }
    */

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Get area map error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area map' },
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
            console.log(`✅ Using category ${edition.category_id} watermark settings`);
          }
        }

        if (!watermarkSettings) {
          const [globalSettings] = await db
            .select()
            .from(area_map_watermark_settings)
            .where(eq(area_map_watermark_settings.id, 1))
            .limit(1);
          
          watermarkSettings = globalSettings;
          console.log('⚠️ Using global watermark settings');
        }

        // Apply watermark to image
        if (watermarkSettings && watermarkSettings.enable_watermarking) {
          const context = {
            edition_title: edition?.title || '',
            date: edition?.date?.toString() || new Date().toISOString().split('T')[0],
            url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/area-map/${areaMapId}`
          };

          console.log(`✅ Regenerating with category ${edition?.category_id} watermark`);
          
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
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Watermarking is not enabled'
          }, { status: 400 });
        }
      } catch (watermarkError) {
        console.error('Watermark regeneration error:', watermarkError);
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
    console.error('Update area map error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update area map' },
      { status: 500 }
    );
  }
}
