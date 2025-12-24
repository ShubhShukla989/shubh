import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slides } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PUT /api/sliders/[id]/slides/reorder
 * Reorder slides
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: 'Order must be an array of slide IDs' },
        { status: 400 }
      );
    }

    // Update position for each slide
    const updates = order.map((slideId, index) =>
      db
        .update(slides)
        .set({ position: index })
        .where(
          and(
            eq(slides.id, slideId),
            eq(slides.slider_id, parseInt(params.id))
          )
        )
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/sliders/[id]/slides/reorder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
