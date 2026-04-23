import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps, edition_pages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Disable Next.js caching for area maps
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);

    // Get all area maps for this edition by joining with edition_pages
    const areaMaps = await db
      .select({
        id: area_maps.id,
        page_id: area_maps.page_id,
        x: area_maps.x,
        y: area_maps.y,
        width: area_maps.width,
        height: area_maps.height,
        title: area_maps.title,
        url: area_maps.url,
        linked_area_ids: area_maps.linked_area_ids,
        page_number: edition_pages.page_number,
      })
      .from(area_maps)
      .innerJoin(edition_pages, eq(area_maps.page_id, edition_pages.id))
      .where(eq(edition_pages.edition_id, editionId));

    // Parse linked_area_ids from JSON string to array for each area map
    const parsedAreaMaps = areaMaps.map(areaMap => ({
      ...areaMap,
      linked_area_ids: areaMap.linked_area_ids 
        ? JSON.parse(areaMap.linked_area_ids as string)
        : []
    }));

    console.log('📦 Fetched area maps with parsed linked_area_ids:', parsedAreaMaps);

    return NextResponse.json({ success: true, data: parsedAreaMaps }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Failed to fetch all area maps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area maps' },
      { status: 500 }
    );
  }
}