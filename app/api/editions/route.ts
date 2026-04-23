import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages, users, epaper_categories } from '@/lib/schema';
import { eq, desc, asc, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateWidgetCachesAsync } from '@/lib/cache/universal';

// Disable Next.js caching for admin panel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getEditionsHandler(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');
    const createdBy = searchParams.get('created_by');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;

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

    const createdByUser = users;

    const selectFields = {
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
    };

    let query = db
      .select(selectFields)
      .from(editions)
      .leftJoin(createdByUser, eq(editions.created_by, createdByUser.id))
      .orderBy(desc(editions.created_at), desc(editions.id))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (limit) {
      query = query.limit(limit);
    }

    const editionsData = await query;

    // Batch fetch all pages in a single query (fixes N+1)
    const editionIds = editionsData.map(e => e.id);
    const allPages = editionIds.length > 0
      ? await db
          .select({
            id: edition_pages.id,
            edition_id: edition_pages.edition_id,
            page_number: edition_pages.page_number,
            image_url: edition_pages.image_url,
            thumb_url: edition_pages.thumb_url,
          })
          .from(edition_pages)
          .where(inArray(edition_pages.edition_id, editionIds))
          .orderBy(asc(edition_pages.page_number))
      : [];

    // Group pages by edition_id
    const pagesByEdition = allPages.reduce((acc, page) => {
      if (page.edition_id === null) return acc;
      if (!acc[page.edition_id]) acc[page.edition_id] = [];
      acc[page.edition_id].push(page);
      return acc;
    }, {} as Record<number, typeof allPages>);

    const processedData = editionsData.map(edition => ({
      ...edition,
      pages: pagesByEdition[edition.id] || [],
    }));

    return NextResponse.json({ success: true, data: processedData }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch editions' }, { status: 500 });
  }
}

// Apply caching middleware to GET requests - DISABLED FOR ADMIN PANEL
// export const GET = withCache(getEditionsHandler, CACHE_CONFIG);

// Direct handler without caching for admin panel
export async function GET(request: NextRequest) {
  return getEditionsHandler(request);
}

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
        created_at: new Date().toISOString(), // Explicitly set created_at
        updated_at: new Date().toISOString(), // Explicitly set updated_at
      })
      .returning();

    // 🚀 UNIVERSAL CACHE INVALIDATION (Production Safe - Async)
    invalidateWidgetCachesAsync();

    // Revalidate affected pages if published (direct call - no HTTP)
    if (status === 'published') {
      try {
        // Use "page" type for proper route cache invalidation
        revalidatePath('/', 'page'); // Homepage
        revalidatePath('/epaper', 'page'); // EPaper section
        revalidatePath('/epaper/display', 'page'); // Display page
        
        // Revalidate category page using alias (not ID — alias is the actual route param)
        if (category_id) {
          const [cat] = await db
            .select({ alias: epaper_categories.alias })
            .from(epaper_categories)
            .where(eq(epaper_categories.id, category_id))
            .limit(1);

          if (cat?.alias) {
            revalidatePath(`/epaper/category/${cat.alias}`, 'page');
          }
        }
        
        console.log('✅ Cache revalidated for new edition');
      } catch (e) {
        console.error('❌ Failed to revalidate cache:', e);
      }
    }

    return NextResponse.json({ success: true, data: newEdition }, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create edition' },
      { status: 500 }
    );
  }
}
