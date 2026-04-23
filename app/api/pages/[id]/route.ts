import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateCacheKeysAsync } from '@/lib/cache/universal';

/**
 * GET /api/pages/[id] - Get single page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, parseInt(params.id)))
      .limit(1);

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pages/[id] - Update page
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const [updated] = await db
      .update(pages)
      .set({ ...body, updated_at: new Date().toISOString() })
      .where(eq(pages.id, parseInt(params.id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    invalidateCacheKeysAsync(['pages:*', `layout:page:${updated.alias}`]);
    if (updated.alias) revalidatePath(`/${updated.alias}`, 'page');
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update page' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pages/[id] - Delete page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [existing] = await db.select({ alias: pages.alias }).from(pages)
      .where(eq(pages.id, parseInt(params.id))).limit(1);

    await db
      .delete(pages)
      .where(eq(pages.id, parseInt(params.id)));

    invalidateCacheKeysAsync(['pages:*', 'menu:*', 'layout:menu:*', ...(existing?.alias ? [`layout:page:${existing.alias}`] : [])]);
    if (existing?.alias) revalidatePath(`/${existing.alias}`, 'page');

    return NextResponse.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
