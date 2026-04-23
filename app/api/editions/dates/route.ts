import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions } from '@/lib/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getCached, setCache } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/editions/dates?category_id=1
 * Returns only the distinct published dates for a category.
 * Lightweight replacement for the calendar widget — no full edition objects.
 * Redis cached, invalidated by invalidateWidgetCaches() on publish.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const categoryId = parseInt(params.get('category_id') || '0');

    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'category_id required' }, { status: 400 });
    }

    const cacheKey = `epaper:edition-dates:${categoryId}`;

    // Try Redis first
    const cached = await getCached<string[]>(cacheKey);
    if (cached) {
      return NextResponse.json(
        { success: true, dates: cached },
        { headers: { 'X-Cache-Status': 'HIT' } }
      );
    }

    // Fetch only dates — no joins, no pages, no user data
    // Limit to last 2 years to keep the query fast even at scale
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const rows = await db
      .selectDistinct({ date: sql<string>`DATE(${editions.date})` })
      .from(editions)
      .where(
        and(
          eq(editions.category_id, categoryId),
          eq(editions.status, 'published'),
          gte(editions.date, twoYearsAgo.toISOString().split('T')[0])
        )
      )
      .orderBy(sql`DATE(${editions.date}) DESC`);

    const dates = rows.map(r => r.date as string);

    // Cache for 5 minutes — invalidated by invalidateWidgetCaches() on publish
    await setCache(cacheKey, dates, 300);

    return NextResponse.json(
      { success: true, dates },
      { headers: { 'X-Cache-Status': 'MISS' } }
    );
  } catch (error) {
    console.error('edition-dates error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
