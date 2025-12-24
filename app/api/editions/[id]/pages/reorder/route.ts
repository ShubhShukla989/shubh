import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { edition_pages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { pageOrder } = await request.json();

    if (!Array.isArray(pageOrder)) {
      return NextResponse.json(
        { success: false, error: 'pageOrder must be an array' },
        { status: 400 }
      );
    }

    // Update page numbers
    for (let i = 0; i < pageOrder.length; i++) {
      await db
        .update(edition_pages)
        .set({ page_number: i + 1 })
        .where(eq(edition_pages.id, pageOrder[i]));
    }

    return NextResponse.json({
      success: true,
      message: 'Pages reordered successfully',
    });
  } catch (error) {
    console.error('Reorder pages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder pages' },
      { status: 500 }
    );
  }
}
