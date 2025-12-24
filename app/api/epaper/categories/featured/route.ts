import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Featured categories API called');

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
      { success: false, error: 'Failed to fetch featured categories' },
      { status: 500 }
    );
  }
}