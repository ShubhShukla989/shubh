import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages, users } from '@/lib/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { withCache, invalidateCacheByTags } from '@/lib/cache';

// Cache configuration for editions - EXTREME performance for 1000+ users
const CACHE_CONFIG = {
  ttl: 1800, // 30 minutes for user-facing API
  tags: ['editions'],
};

async function getEditionsHandler(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');
    const createdBy = searchParams.get('created_by');

    // Build query conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(editions.status, status));
    }
    if (categoryId) {
      conditions.push(eq(editions.category_id, parseInt(categoryId)));
    }
    if (createdBy && createdBy !== 'all') {
      conditions.push(eq(editions.created_by, parseInt(createdBy)));
    }

    // Get editions with user information
    const createdByUser = users;
    const updatedByUser = users;
    
    let editionsData;
    
    if (conditions.length > 0) {
      editionsData = await db
        .select({
          id: editions.id,
          title: editions.title,
          alias: editions.alias,
          date: editions.date,
          category_id: editions.category_id,
          pdf_url: editions.pdf_url,
          description: editions.description,
          status: editions.status,
          created_by: editions.created_by,
          updated_by: editions.updated_by,
          created_at: editions.created_at,
          updated_at: editions.updated_at,
          is_featured: editions.is_featured,
          seo_h1: editions.seo_h1,
          seo_meta_description: editions.seo_meta_description,
          scheduled_date: editions.scheduled_date,
          created_by_name: createdByUser.fullname,
        })
        .from(editions)
        .leftJoin(createdByUser, eq(editions.created_by, createdByUser.id))
        .where(and(...conditions))
        .orderBy(desc(editions.date));
    } else {
      editionsData = await db
        .select({
          id: editions.id,
          title: editions.title,
          alias: editions.alias,
          date: editions.date,
          category_id: editions.category_id,
          pdf_url: editions.pdf_url,
          description: editions.description,
          status: editions.status,
          created_by: editions.created_by,
          updated_by: editions.updated_by,
          created_at: editions.created_at,
          updated_at: editions.updated_at,
          is_featured: editions.is_featured,
          seo_h1: editions.seo_h1,
          seo_meta_description: editions.seo_meta_description,
          scheduled_date: editions.scheduled_date,
          created_by_name: createdByUser.fullname,
        })
        .from(editions)
        .leftJoin(createdByUser, eq(editions.created_by, createdByUser.id))
        .orderBy(desc(editions.date));
    }

    // Get pages for each edition
    const processedData = await Promise.all(
      editionsData.map(async (edition) => {
        const pages = await db
          .select({
            id: edition_pages.id,
            page_number: edition_pages.page_number,
            image_url: edition_pages.image_url,
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
    console.error('[GET /api/editions] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch editions' }, { status: 500 });
  }
}

// Apply caching middleware to GET requests
export const GET = withCache(getEditionsHandler, CACHE_CONFIG);

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();

    // Normalize and validate payload
    const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null;
    const alias = typeof raw.alias === 'string' && raw.alias.trim() ? raw.alias.trim() : null;
    const date = typeof raw.date === 'string' && raw.date.trim() ? raw.date.trim() : null;
    const category_id = raw.category_id ? Number(raw.category_id) : null;
    const description = typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : null;
    const validStatuses = ['draft', 'processing', 'published', 'scheduled'];
    const normalizedStatus = raw.status ? raw.status.toLowerCase() : 'draft';
    const status = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'draft';
    const pdf_url = typeof raw.pdf_url === 'string' && raw.pdf_url.trim() ? raw.pdf_url.trim() : null;
    const scheduled_date = raw.scheduled_date && typeof raw.scheduled_date === 'string' ? raw.scheduled_date : null;
    const seo_h1 = typeof raw.seo_h1 === 'string' && raw.seo_h1.trim() ? raw.seo_h1.trim() : null;
    const seo_meta_description = typeof raw.seo_meta_description === 'string' && raw.seo_meta_description.trim() ? raw.seo_meta_description.trim() : null;

    if (!title || !date) {
      return NextResponse.json(
        { success: false, error: 'Validation error: title and date are required' },
        { status: 400 }
      );
    }

    const [newEdition] = await db
      .insert(editions)
      .values({
        title,
        alias,
        date,
        category_id,
        description,
        status,
        pdf_url,
        scheduled_date: scheduled_date ? new Date(scheduled_date).toISOString() : null,
        seo_h1,
        seo_meta_description,
      })
      .returning();

    // Invalidate editions cache
    invalidateCacheByTags(['editions']);

    return NextResponse.json({ success: true, data: newEdition }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/editions] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create edition' },
      { status: 500 }
    );
  }
}
