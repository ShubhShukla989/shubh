/**
 * Service to regenerate all area map watermarks when settings change
 * Ensures all area maps have pre-generated images for instant loading
 */

import { db } from '@/lib/db';
import { area_maps, editions } from '@/lib/schema';
import { eq, and, isNotNull, inArray } from 'drizzle-orm';
import { generateNormalAreaWatermark } from '@/lib/generate-normal-area-watermark';
import { generateCombinedAreaImage, generateGroupId, updateAreaMapsWithGroup } from '@/lib/generate-combined-area-image';

interface RegenerationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ areaId: number; error: string }>;
}

const BATCH_SIZE = 5;

/**
 * Regenerate all area maps for a specific category
 */
export async function regenerateAreaMapsForCategory(
  categoryId: number,
  watermarkVersionNum: number
): Promise<RegenerationProgress> {
  const watermarkVersion = String(watermarkVersionNum);
  const progress: RegenerationProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  // Find all editions for this category
  const categoryEditions = await db
    .select()
    .from(editions)
    .where(eq(editions.category_id, categoryId));

  if (categoryEditions.length === 0) {
    return progress;
  }

  const editionIds = categoryEditions.map(e => e.id);

  // Find all area maps for these editions
  const areaMaps = await db
    .select()
    .from(area_maps)
    .where(
      and(
        isNotNull(area_maps.edition_id),
        inArray(area_maps.edition_id, editionIds)
      )
    );

  progress.total = areaMaps.length;

  // Process in parallel batches of BATCH_SIZE
  for (let i = 0; i < areaMaps.length; i += BATCH_SIZE) {
    const batch = areaMaps.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async (areaMap) => {
      const result = { processed: 1, successful: 0, failed: 0, errors: [] as Array<{ areaId: number; error: string }> };
      try {
        const linkedAreaIds = areaMap.linked_area_ids
          ? JSON.parse(areaMap.linked_area_ids as string)
          : [];

        if (linkedAreaIds.length > 0) {
          const allAreaIds = [areaMap.id, ...linkedAreaIds];
          const groupId = generateGroupId(allAreaIds);
          const combinedUrl = await generateCombinedAreaImage(allAreaIds, groupId);

          if (combinedUrl) {
            await updateAreaMapsWithGroup(allAreaIds, groupId, combinedUrl);
            // Single batched update for all areas in group
            await db
              .update(area_maps)
              .set({ watermark_version: watermarkVersion })
              .where(inArray(area_maps.id, allAreaIds));
            result.successful++;
          } else {
            result.failed++;
            result.errors.push({ areaId: areaMap.id, error: 'Failed to generate combined image' });
          }
        } else {
          const watermarkedUrl = await generateNormalAreaWatermark(areaMap.id);

          if (watermarkedUrl) {
            await db
              .update(area_maps)
              .set({ watermark_version: watermarkVersion })
              .where(eq(area_maps.id, areaMap.id));
            result.successful++;
          } else {
            result.failed++;
            result.errors.push({ areaId: areaMap.id, error: 'Failed to generate watermarked image' });
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          areaId: areaMap.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return result;
    }));

    for (const r of results) {
      progress.processed += r.processed;
      progress.successful += r.successful;
      progress.failed += r.failed;
      progress.errors.push(...r.errors);
    }
  }

  return progress;
}

/**
 * Regenerate all area maps globally (when global watermark settings change)
 */
export async function regenerateAllAreaMaps(
  watermarkVersionNum: number
): Promise<RegenerationProgress> {
  const watermarkVersion = String(watermarkVersionNum);
  const progress: RegenerationProgress = {
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  };

  const areaMaps = await db.select().from(area_maps);
  progress.total = areaMaps.length;

  // Process in parallel batches of BATCH_SIZE
  for (let i = 0; i < areaMaps.length; i += BATCH_SIZE) {
    const batch = areaMaps.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async (areaMap) => {
      const result = { processed: 1, successful: 0, failed: 0, errors: [] as Array<{ areaId: number; error: string }> };
      try {
        const linkedAreaIds = areaMap.linked_area_ids
          ? JSON.parse(areaMap.linked_area_ids as string)
          : [];

        if (linkedAreaIds.length > 0) {
          const allAreaIds = [areaMap.id, ...linkedAreaIds];
          const groupId = generateGroupId(allAreaIds);
          const combinedUrl = await generateCombinedAreaImage(allAreaIds, groupId);

          if (combinedUrl) {
            await updateAreaMapsWithGroup(allAreaIds, groupId, combinedUrl);
            // Single batched update for all areas in group
            await db
              .update(area_maps)
              .set({ watermark_version: watermarkVersion })
              .where(inArray(area_maps.id, allAreaIds));
            result.successful++;
          } else {
            result.failed++;
            result.errors.push({ areaId: areaMap.id, error: 'Failed to generate combined image' });
          }
        } else {
          const watermarkedUrl = await generateNormalAreaWatermark(areaMap.id);

          if (watermarkedUrl) {
            await db
              .update(area_maps)
              .set({ watermark_version: watermarkVersion })
              .where(eq(area_maps.id, areaMap.id));
            result.successful++;
          } else {
            result.failed++;
            result.errors.push({ areaId: areaMap.id, error: 'Failed to generate watermarked image' });
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          areaId: areaMap.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return result;
    }));

    for (const r of results) {
      progress.processed += r.processed;
      progress.successful += r.successful;
      progress.failed += r.failed;
      progress.errors.push(...r.errors);
    }
  }

  return progress;
}

/**
 * Generate watermark for a single area map (used when creating new area maps)
 */
export async function generateWatermarkForAreaMap(
  areaMapId: number,
  watermarkVersionNum: number
): Promise<boolean> {
  const watermarkVersion = String(watermarkVersionNum);
  try {
    const [areaMap] = await db
      .select()
      .from(area_maps)
      .where(eq(area_maps.id, areaMapId))
      .limit(1);

    if (!areaMap) {
      return false;
    }

    const linkedAreaIds = areaMap.linked_area_ids
      ? JSON.parse(areaMap.linked_area_ids as string)
      : [];

    if (linkedAreaIds.length > 0) {
      const allAreaIds = [areaMap.id, ...linkedAreaIds];
      const groupId = generateGroupId(allAreaIds);
      const combinedUrl = await generateCombinedAreaImage(allAreaIds, groupId);

      if (combinedUrl) {
        await updateAreaMapsWithGroup(allAreaIds, groupId, combinedUrl);
        // Single batched update for all areas in group
        await db
          .update(area_maps)
          .set({ watermark_version: watermarkVersion })
          .where(inArray(area_maps.id, allAreaIds));
        return true;
      }
      return false;
    } else {
      const watermarkedUrl = await generateNormalAreaWatermark(areaMap.id);

      if (watermarkedUrl) {
        await db
          .update(area_maps)
          .set({ watermark_version: watermarkVersion })
          .where(eq(area_maps.id, areaMap.id));
        return true;
      }
      return false;
    }
  } catch (error) {
    return false;
  }
}
