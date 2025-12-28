import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // During build time, return empty data to prevent build failures
    if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
      return NextResponse.json({ success: true, data: [] });
    }

    console.log('Featured categories API called');

    const { db } = await import('@/lib/db');
    const { epaper_categories } = await import('@/lib/schema');
    const { eq, asc } = await import('drizzle-orm');

    console.log('Querying featured categories...');
    const data = await db
      .select()
      .from(epaper_categories)
      .where(eq(epaper_categories.is_featured, true))
      .orderBy(asc(epaper_categories.display_order));

    console.log('Query result:', { data });
    console.log('Returning data:', data);
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[GET /api/epaper/categories/featured] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured categories', data: [] },
      { status: 500 }
    );
  }
}