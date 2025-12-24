import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
    console.error('Get page error:', error);
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

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update page error:', error);
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
    await db
      .delete(pages)
      .where(eq(pages.id, parseInt(params.id)));

    return NextResponse.json({ success: true, message: 'Page deleted' });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
