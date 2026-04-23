import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_map_watermark_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(area_map_watermark_settings)
      .where(eq(area_map_watermark_settings.id, 1))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: data ?? null
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regenerate_watermarks, ...settings } = body;

    // Generate new watermark version
    const watermarkVersion = new Date().toISOString();

    // Check if settings exist
    const [existing] = await db
      .select()
      .from(area_map_watermark_settings)
      .where(eq(area_map_watermark_settings.id, 1))
      .limit(1);

    let data;
    if (existing) {
      [data] = await db
        .update(area_map_watermark_settings)
        .set({
          ...settings,
          watermark_version: watermarkVersion,
          updated_at: new Date().toISOString()
        })
        .where(eq(area_map_watermark_settings.id, 1))
        .returning();
    } else {
      [data] = await db
        .insert(area_map_watermark_settings)
        .values({
          id: 1,
          ...settings,
          watermark_version: watermarkVersion,
        })
        .returning();
    }

    // ALWAYS invalidate cache when settings change (so new settings apply immediately)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/area-maps/invalidate-cache`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('[area-map-watermark] Cache invalidation failed:', err);
    }

    // Trigger watermark regeneration if requested
    if (regenerate_watermarks) {
      // Trigger regeneration in background (don't wait for it)
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/area-maps/regenerate-watermarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watermarkVersion })
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Settings saved and cache cleared. Watermark regeneration started in background.',
        data,
        watermarkVersion,
        cache_invalidated: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved and cache cleared. Next user click will use new settings.',
      data,
      watermarkVersion,
      cache_invalidated: true
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
