import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { slides } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { invalidateCacheKeysAsync } from '@/lib/cache/universal';

/**
 * GET /api/sliders/[id]/slides
 * Fetch all slides for a slider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await db
      .select()
      .from(slides)
      .where(eq(slides.slider_id, parseInt(params.id)))
      .orderBy(asc(slides.position));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/sliders/[id]/slides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sliders/[id]/slides
 * Add a new slide to a slider
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { imageUrl, caption, alt, link, position, visible } = body;

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Create slide
    const [data] = await db
      .insert(slides)
      .values({
        slider_id: parseInt(params.id),
        image_url: imageUrl,
        caption,
        alt: alt || '',
        link,
        position: position || 0,
        visible: visible !== false,
      })
      .returning();

    invalidateCacheKeysAsync([`slider:${params.id}`, `layout:slider:${params.id}`]);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sliders/[id]/slides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
