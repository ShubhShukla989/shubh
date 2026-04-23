import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema';
import { eq, desc, asc, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/editions/featured
 * Returns featured editions — direct DB, no Redis cache.
 */
export async function GET() {
  try {
    const data = await db
      .select()
      .from(editions)
      .where(eq(editions.is_featured, true))
      .orderBy(desc(editions.date))
      .limit(10);

    const editionIds = data.map(e => e.id);
    const allPages = editionIds.length > 0
      ? await db
          .select({ id: edition_pages.id, edition_id: edition_pages.edition_id, page_number: edition_pages.page_number, image_url: edition_pages.image_url, thumb_url: edition_pages.thumb_url })
          .from(edition_pages)
          .where(inArray(edition_pages.edition_id, editionIds))
          .orderBy(asc(edition_pages.page_number))
      : [];

    const pagesByEdition: Record<number, typeof allPages> = {};
    for (const page of allPages) {
      if (page.edition_id !== null) {
        if (!pagesByEdition[page.edition_id]) pagesByEdition[page.edition_id] = [];
        pagesByEdition[page.edition_id].push(page);
      }
    }

    const processedData = data.map(edition => ({
      ...edition,
      pages: pagesByEdition[edition.id] || [],
    }));

    return NextResponse.json({ success: true, data: processedData });
  } catch (error) {
    console.error('Error fetching featured editions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch featured editions' }, { status: 500 });
  }
}
