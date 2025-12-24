import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slides } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PUT /api/sliders/[id]/slides/[slideId]
 * Update a slide
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; slideId: string } }
) {
  try {
    const body = await request.json();
    const { imageUrl, caption, alt, link, position, visible } = body;

    const [data] = await db
      .update(slides)
      .set({
        image_url: imageUrl,
        caption,
        alt,
        link,
        position,
        visible,
        updated_at: new Date().toISOString(),
      })
      .where(
        and(
          eq(slides.id, parseInt(params.slideId)),
          eq(slides.slider_id, parseInt(params.id))
        )
      )
      .returning();

    if (!data) {
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/sliders/[id]/slides/[slideId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sliders/[id]/slides/[slideId]
 * Delete a slide
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; slideId: string } }
) {
  try {
    await db
      .delete(slides)
      .where(
        and(
          eq(slides.id, parseInt(params.slideId)),
          eq(slides.slider_id, parseInt(params.id))
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/sliders/[id]/slides/[slideId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
