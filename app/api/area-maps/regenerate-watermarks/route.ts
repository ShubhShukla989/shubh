import { NextRequest, NextResponse } from 'next/server';
import { regenerateAreaMapsForCategory, regenerateAllAreaMaps } from '@/lib/services/watermarkRegenerationService';

/**
 * POST /api/area-maps/regenerate-watermarks
 * Regenerate watermarks for area maps
 * 
 * Body:
 * - categoryId?: number - If provided, regenerate only for this category
 * - watermarkVersion: string - Version identifier for the watermark
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, watermarkVersion } = body;

    if (!watermarkVersion) {
      return NextResponse.json(
        { success: false, error: 'watermarkVersion is required' },
        { status: 400 }
      );
    }

    let progress;

    if (categoryId) {
      // Regenerate for specific category
      progress = await regenerateAreaMapsForCategory(categoryId, watermarkVersion);
    } else {
      // Regenerate all
      progress = await regenerateAllAreaMaps(watermarkVersion);
    }

    return NextResponse.json({
      success: true,
      message: `Regeneration complete: ${progress.successful} successful, ${progress.failed} failed`,
      data: progress
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to regenerate watermarks' 
      },
      { status: 500 }
    );
  }
}
