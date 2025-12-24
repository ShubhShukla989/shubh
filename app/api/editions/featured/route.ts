import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select()
      .from(editions)
      .where(eq(editions.is_featured, true))
      .orderBy(desc(editions.date))
      .limit(10);

    // Get pages for each edition
    const processedData = await Promise.all(
      data.map(async (edition) => {
        const pages = await db
          .select({
            id: edition_pages.id,
            page_number: edition_pages.page_number,
            image_url: edition_pages.image_url,
            thumb_url: edition_pages.thumb_url,
          })
          .from(edition_pages)
          .where(eq(edition_pages.edition_id, edition.id))
          .orderBy(asc(edition_pages.page_number));

        return {
          ...edition,
          pages,
        };
      })
    );

    return NextResponse.json({ success: true, data: processedData });
  } catch (error) {
    console.error('Get featured editions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured editions' },
      { status: 500 }
    );
  }
}
