import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps, edition_pages, editions } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    // Get all area maps
    const allAreaMaps = await db.select().from(area_maps);
    
    // Get all edition pages
    const allPages = await db.select().from(edition_pages);
    
    // Get all editions
    const allEditions = await db.select().from(editions);

    return NextResponse.json({
      success: true,
      data: {
        area_maps: allAreaMaps,
        edition_pages: allPages,
        editions: allEditions
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}