import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/editions/latest-by-categories?ids=1,2,3
 * Returns the latest published edition per category — direct DB, no Redis cache.
 * At 1000 users/day this is fast enough without caching.
 */
export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ success: false, error: 'ids param required' }, { status: 400 });
    }

    const categoryIds = idsParam
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    if (categoryIds.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const allEditions = await db
      .select({
        id: editions.id,
        title: editions.title,
        alias: editions.alias,
        date: editions.date,
        category_id: editions.category_id,
        status: editions.status,
      })
      .from(editions)
      .where(and(inArray(editions.category_id, categoryIds), eq(editions.status, 'published')))
      .orderBy(desc(editions.date));

    const latestPerCategory: Record<number, typeof allEditions[0]> = {};
    for (const edition of allEditions) {
      if (edition.category_id && !latestPerCategory[edition.category_id]) {
        latestPerCategory[edition.category_id] = edition;
      }
    }

    const editionIds = Object.values(latestPerCategory).map(e => e.id);

    const pages = editionIds.length > 0
      ? await db
          .select({
            edition_id: edition_pages.edition_id,
            page_number: edition_pages.page_number,
            image_url: edition_pages.image_url,
            thumb_url: edition_pages.thumb_url,
          })
          .from(edition_pages)
          .where(and(inArray(edition_pages.edition_id, editionIds), eq(edition_pages.page_number, 1)))
      : [];

    const pageByEdition: Record<number, typeof pages[0]> = {};
    for (const page of pages) {
      if (page.edition_id !== null) pageByEdition[page.edition_id] = page;
    }

    const result: Record<number, any> = {};
    for (const [catId, edition] of Object.entries(latestPerCategory)) {
      result[Number(catId)] = {
        ...edition,
        pages: pageByEdition[edition.id] ? [pageByEdition[edition.id]] : [],
      };
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('latest-by-categories error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
