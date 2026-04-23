import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions, edition_pages, epaper_categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { invalidateWidgetCaches } from '@/lib/cache/universal';
import { revalidatePath } from 'next/cache';

// Disable Next.js caching for admin panel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [data] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, parseInt(params.id)))
      .limit(1);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch edition' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate and normalize status if present
    if (body.status) {
      const normalizedStatus = body.status.toLowerCase();
      const validStatuses = ['draft', 'processing', 'published', 'scheduled'];
      
      if (!validStatuses.includes(normalizedStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      
      body.status = normalizedStatus;
    }

    // Handle scheduled_date - allow null to clear it
    if ('scheduled_date' in body) {
      if (body.scheduled_date === null || body.scheduled_date === '') {
        body.scheduled_date = null;
      }
    }

    const [data] = await db
      .update(editions)
      .set({ ...body, updated_at: new Date().toISOString() })
      .where(eq(editions.id, parseInt(params.id)))
      .returning();

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    // Await cache invalidation so homepage widget reflects new data immediately
    await invalidateWidgetCaches();

    // Revalidate affected pages (direct call - no HTTP overhead)
    if (body.status === 'published' || body.is_featured) {
      try {
        // Use "page" type for proper route cache invalidation
        revalidatePath('/', 'page'); // Homepage
        revalidatePath('/epaper', 'page'); // EPaper section
        revalidatePath('/epaper/display', 'page'); // Display page
        
        // Revalidate category page using alias (not ID — alias is the actual route param)
        if (data.category_id) {
          const [cat] = await db
            .select({ alias: epaper_categories.alias })
            .from(epaper_categories)
            .where(eq(epaper_categories.id, data.category_id))
            .limit(1);

          if (cat?.alias) {
            revalidatePath(`/epaper/category/${cat.alias}`, 'page');
          }
        }
        
        // Revalidate edition view page
        revalidatePath(`/epaper/view/${params.id}`, 'page');
        
        console.log('✅ Cache revalidated for edition update');
      } catch (e) {
        console.error('❌ Failed to revalidate cache:', e);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update edition' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);

    // Delete pages first (no FK cascade in schema), then the edition
    await db.delete(edition_pages).where(eq(edition_pages.edition_id, editionId));
    await db.delete(editions).where(eq(editions.id, editionId));

    // Await cache invalidation so the next request never gets stale data
    await invalidateWidgetCaches();

    revalidatePath('/', 'page');
    revalidatePath('/epaper', 'page');
    revalidatePath('/epaper/display', 'page');

    return NextResponse.json({
      success: true,
      message: 'Edition deleted successfully',
    });
  } catch (error) {
    console.error('❌ Failed to delete edition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete edition' },
      { status: 500 }
    );
  }
}
