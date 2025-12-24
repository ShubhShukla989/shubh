import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { edition_pages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const [page] = await db
      .select()
      .from(edition_pages)
      .where(eq(edition_pages.id, parseInt(params.pageId)))
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const body = await request.json();

    const [updated] = await db
      .update(edition_pages)
      .set(body)
      .where(eq(edition_pages.id, parseInt(params.pageId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    await db
      .delete(edition_pages)
      .where(eq(edition_pages.id, parseInt(params.pageId)));

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
