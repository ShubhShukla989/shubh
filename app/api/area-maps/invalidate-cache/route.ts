import { NextRequest, NextResponse } from 'next/server';
import { clearWatermarkMemCache } from '@/lib/cache/settings';

/**
 * CACHE INVALIDATION API
 *
 * When watermark settings change:
 * - Clears in-memory cache immediately
 * - Stale DB/disk images are detected lazily via watermark_version comparison
 *   on next user click — no thundering herd from nuking everything at once
 */

export async function POST(request: NextRequest) {
  try {
    clearWatermarkMemCache();

    return NextResponse.json({
      success: true,
      message: 'Memory cache cleared. Stale area map images will regenerate lazily on next click.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
