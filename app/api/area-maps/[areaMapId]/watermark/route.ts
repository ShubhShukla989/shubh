import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps, editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import redis from '@/lib/cache/redis';
import { acquireSlot, releaseSlot } from '@/lib/cache/semaphore';
import { getWatermarkFromMemCache, setWatermarkInMemCache } from '@/lib/cache/settings';
import { getWatermarkSettings } from '@/lib/watermark-helper';

/**
 * ON-DEMAND WATERMARK GENERATION
 *
 * Two-layer protection against burst load:
 *
 * Layer 1 — Per-area deduplication lock (Redis NX)
 *   Prevents the same area being generated more than once concurrently.
 *   Waiters poll DB until the first generator finishes, then serve from cache.
 *
 * Layer 2 — Global generation semaphore (max 10 concurrent jobs)
 *   Prevents 100 different areas all generating simultaneously and spiking CPU.
 *   Waiters queue and retry every 300ms for up to 12s before timing out.
 *
 * Hot path (cache hit): ~20ms, zero DB, zero CPU — unaffected by either layer.
 */

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { areaMapId: string } }
) {
  const areaMapId = parseInt(params.areaMapId);
  const lockKey = `lock:area-watermark:${areaMapId}`;

  try {
    // ── Layer 0: in-process memory cache (fastest, ~0ms) ──────────────────
    const memHit = getWatermarkFromMemCache(areaMapId);
    if (memHit) {
      return NextResponse.json({
        success: true, cached: true, source: 'memory',
        data: { watermarked_image_url: memHit }
      });
    }

    // ── Layer 1: DB disk cache check + version validation ────────────────
    const [areaMap] = await db
      .select()
      .from(area_maps)
      .where(eq(area_maps.id, areaMapId))
      .limit(1);

    if (!areaMap) {
      return NextResponse.json({ success: false, error: 'Area map not found' }, { status: 404 });
    }

    const existingUrl = areaMap.combined_image_url || areaMap.watermarked_image_url;
    if (existingUrl) {
      // Always do version check — treat null version as stale so first-time
      // generated images (before versioning) are always regenerated on settings change
      let isStale = false;
      try {
        const [edition] = await db
          .select({ category_id: editions.category_id })
          .from(editions)
          .where(eq(editions.id, areaMap.edition_id!))
          .limit(1);
        const settings = await getWatermarkSettings(edition?.category_id ?? undefined);
        const currentVersion = (settings as any)?.watermark_version ?? null;
        // Stale if: settings have a version AND it doesn't match stored version
        // Also stale if: settings have a version but area has no version (legacy image)
        if (currentVersion && currentVersion !== areaMap.watermark_version) {
          isStale = true;
        }
      } catch {
        // Version check failed — treat as stale to be safe, force regeneration
        isStale = true;
      }

      if (!isStale) {
        setWatermarkInMemCache(areaMapId, existingUrl);
        return NextResponse.json({
          success: true, cached: true, source: 'disk',
          data: {
            watermarked_image_url: areaMap.watermarked_image_url,
            combined_image_url: areaMap.combined_image_url
          }
        });
      }
      // Stale — fall through to regenerate
    }

    // ── Layer 2: per-area deduplication lock ──────────────────────────────
    // Only one request generates per area — others wait and serve from DB.
    let lockAcquired = false;
    try {
      lockAcquired = (await redis.set(lockKey, '1', 'EX', 30, 'NX')) === 'OK';
    } catch {
      lockAcquired = true; // Redis down — bypass lock, allow generation
    }

    if (!lockAcquired) {
      // Another request is generating this area — poll DB for up to 12s
      const deadline = Date.now() + 12_000;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 500));
        const [fresh] = await db.select().from(area_maps).where(eq(area_maps.id, areaMapId)).limit(1);
        const url = fresh?.combined_image_url || fresh?.watermarked_image_url;
        if (url) {
          setWatermarkInMemCache(areaMapId, url);
          return NextResponse.json({
            success: true, cached: true, source: 'lock-wait',
            data: { watermarked_image_url: fresh.watermarked_image_url, combined_image_url: fresh.combined_image_url }
          });
        }
      }
      // Timed out — fall through and generate (lock holder may have crashed)
    }

    // ── Layer 3: global semaphore — cap concurrent generation at 10 ───────
    // Prevents CPU/memory spike when many different areas are cold-cache.
    const slotAcquired = await acquireSlot();
    if (!slotAcquired) {
      // Could not get a slot within 12s — return a retryable error
      try { await redis.del(lockKey); } catch {}
      return NextResponse.json(
        { success: false, error: 'Server busy, please retry in a moment', retryable: true },
        { status: 503 }
      );
    }

    // ── Generation (protected by both lock + semaphore) ───────────────────
    try {
      const linkedAreaIds = areaMap.linked_area_ids
        ? JSON.parse(areaMap.linked_area_ids).map((id: any) => Number(id))
        : [];

      if (linkedAreaIds.length > 0) {
        const { generateCombinedAreaImage, generateGroupId, updateAreaMapsWithGroup } =
          await import('@/lib/generate-combined-area-image');

        const groupAreaIds = [areaMapId, ...linkedAreaIds].sort((a, b) => a - b);
        const groupId = generateGroupId(groupAreaIds);
        const combinedImageUrl = await generateCombinedAreaImage(groupAreaIds, groupId);

        if (combinedImageUrl) {
          // Fetch version to store alongside the combined image
          const [editionForVersion] = await db
            .select({ category_id: editions.category_id })
            .from(editions)
            .where(eq(editions.id, areaMap.edition_id!))
            .limit(1);
          const settingsForVersion = await getWatermarkSettings(editionForVersion?.category_id ?? undefined);
          const versionToStore = (settingsForVersion as any)?.watermark_version ?? null;

          await updateAreaMapsWithGroup(groupAreaIds, groupId, combinedImageUrl, versionToStore);
          setWatermarkInMemCache(areaMapId, combinedImageUrl);
          return NextResponse.json({
            success: true, cached: false, generated: true,
            data: { combined_image_url: combinedImageUrl }
          });
        }
      } else {
        const { generateNormalAreaWatermark } = await import('@/lib/generate-normal-area-watermark');
        const watermarkedUrl = await generateNormalAreaWatermark(areaMapId, true);

        if (watermarkedUrl) {
          setWatermarkInMemCache(areaMapId, watermarkedUrl);
          return NextResponse.json({
            success: true, cached: false, generated: true,
            data: { watermarked_image_url: watermarkedUrl }
          });
        }

        // Watermarking disabled in settings
        return NextResponse.json({
          success: true, cached: false, generated: false, watermarking_disabled: true,
          data: { watermarked_image_url: null }
        });
      }

      return NextResponse.json({ success: false, error: 'Failed to generate watermark' }, { status: 500 });

    } finally {
      // Always release both — even if generation throws
      await releaseSlot();
      try { await redis.del(lockKey); } catch {}
    }

  } catch (error) {
    console.error('Watermark generation error:', error);
    try { await redis.del(lockKey); } catch {}
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate watermark',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
