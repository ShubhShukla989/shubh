import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sliders, slides } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/sliders/[id]
 * Fetch a single slider by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [slider] = await db
      .select()
      .from(sliders)
      .where(eq(sliders.id, parseInt(params.id)))
      .limit(1);

    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }

    // Get slides sorted by position
    const sliderSlides = await db
      .select()
      .from(slides)
      .where(eq(slides.slider_id, parseInt(params.id)))
      .orderBy(asc(slides.position));

    return NextResponse.json({ ...slider, slides: sliderSlides });
  } catch (error) {
    console.error('Error in GET /api/sliders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sliders/[id]
 * Update a slider
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, alias, description, status, config } = body;

    const [data] = await db
      .update(sliders)
      .set({
        title,
        alias,
        description,
        status,
        config: config ? JSON.stringify(config) : undefined,
        updated_at: new Date().toISOString(),
      })
      .where(eq(sliders.id, parseInt(params.id)))
      .returning();

    if (!data) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/sliders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sliders/[id]
 * Delete a slider and all its slides
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete all slides first
    await db
      .delete(slides)
      .where(eq(slides.slider_id, parseInt(params.id)));

    // Delete slider
    await db
      .delete(sliders)
      .where(eq(sliders.id, parseInt(params.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/sliders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
