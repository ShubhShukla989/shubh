import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema';
import { eq, desc, and, inArray, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/epaper/editions-by-category?category_id=1&page=1&limit=9
 * Paginated editions for category archive — direct DB, no Redis cache.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const categoryId = parseInt(params.get('category_id') || '0');
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const limit = Math.min(50, parseInt(params.get('limit') || '9'));

    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'category_id required' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: count() })
      .from(editions)
      .where(and(eq(editions.category_id, categoryId), eq(editions.status, 'published')));

    const editionsData = await db
      .select({ id: editions.id, title: editions.title, date: editions.date, status: editions.status })
      .from(editions)
      .where(and(eq(editions.category_id, categoryId), eq(editions.status, 'published')))
      .orderBy(desc(editions.date))
      .limit(limit)
      .offset(offset);

    const editionIds = editionsData.map(e => e.id);
    const pages = editionIds.length > 0
      ? await db
          .select({ edition_id: edition_pages.edition_id, image_url: edition_pages.image_url, thumb_url: edition_pages.thumb_url, page_number: edition_pages.page_number })
          .from(edition_pages)
          .where(and(inArray(edition_pages.edition_id, editionIds), eq(edition_pages.page_number, 1)))
      : [];

    const pageByEdition: Record<number, typeof pages[0]> = {};
    for (const p of pages) {
      if (p.edition_id !== null) pageByEdition[p.edition_id] = p;
    }

    const data = editionsData.map(e => ({
      ...e,
      thumbnail: pageByEdition[e.id]?.thumb_url || null,
      totalPages: 0,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('editions-by-category error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
