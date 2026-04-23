import { db } from '@/lib/db';
import { editions, edition_pages, area_maps, area_map_watermark_settings, category_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

interface CompleteEditionData {
  edition: any;
  pages: any[];
  areaMaps: any[];
  watermarkSettings: any;
}

export async function getCompleteEdition(editionId: number): Promise<CompleteEditionData | null> {
  // No Redis cache — always fetch fresh from DB so admin updates reflect instantly
  try {
    // Parallel queries for better performance
    const [editionResult, pagesResult, areaMapsResult, globalWatermarkResult] = await Promise.all([
      // Edition data
      db.select().from(editions).where(eq(editions.id, editionId)).limit(1),
      
      // Pages data
      db.select().from(edition_pages).where(eq(edition_pages.edition_id, editionId)),
      
      // Area maps data with page_number JOIN
      db.select({
        id: area_maps.id,
        page_id: area_maps.page_id,
        x: area_maps.x,
        y: area_maps.y,
        width: area_maps.width,
        height: area_maps.height,
        title: area_maps.title,
        url: area_maps.url,
        linked_area_ids: area_maps.linked_area_ids,
        linked_page_number: area_maps.linked_page_number,
        edition_id: area_maps.edition_id,
        created_at: area_maps.created_at,
        updated_at: area_maps.updated_at,
        page_number: edition_pages.page_number
      })
      .from(area_maps)
      .innerJoin(edition_pages, eq(area_maps.page_id, edition_pages.id))
      .where(eq(area_maps.edition_id, editionId)),
      
      // Global watermark settings
      db.select().from(area_map_watermark_settings).where(eq(area_map_watermark_settings.id, 1)).limit(1)
    ]);

    const edition = editionResult[0];
    if (!edition) {
      return null;
    }

    // Get category-specific watermark settings if edition has category
    let categoryWatermarkResult: any[] = [];
    if (edition.category_id) {
      try {
        categoryWatermarkResult = await db
          .select()
          .from(category_watermark_settings)
          .where(eq(category_watermark_settings.category_id, edition.category_id))
          .limit(1);
      } catch (error) {
        console.warn('Failed to fetch category watermark settings:', error);
      }
    }

    // Determine final watermark settings
    let watermarkSettings = null;
    if (globalWatermarkResult[0]) {
      watermarkSettings = globalWatermarkResult[0];
      
      // Override with category settings if available and enabled
      if (categoryWatermarkResult[0]?.override_global_settings) {
        watermarkSettings = categoryWatermarkResult[0];
      }
    }

    // Default watermark settings if none found
    if (!watermarkSettings) {
      watermarkSettings = {
        enable_watermarking: false,
        logo_url: '',
        logo_width_percentage: 50,
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

    // Strip heavy pre-generated URLs from areaMaps before caching —
    // they are re-fetched on-demand and storing them bloats the payload.
    // Only keep the coordinate/metadata fields needed for rendering.
    const lightAreaMaps = (areaMapsResult || []).map(({ watermarked_image_url, combined_image_url, ...rest }: any) => rest);

    const result: CompleteEditionData = {
      edition,
      pages: pagesResult || [],
      areaMaps: lightAreaMaps,
      watermarkSettings
    };

    return result;
  } catch (error) {
    console.error('Error fetching complete edition data:', error);
    return null;
  }
}

/**
 * No-op — edition cache removed, data always fetched fresh from DB
 */
export async function invalidateCompleteEditionCache(_editionId: number): Promise<void> {
  // nothing to invalidate
}
