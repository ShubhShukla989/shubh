import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sliders, slides } from '@/lib/schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * GET /api/sliders/alias/[alias]
 * Fetch a slider by alias (for frontend display)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { alias: string } }
) {
  try {
    const [slider] = await db
      .select()
      .from(sliders)
      .where(
        and(
          eq(sliders.alias, params.alias),
          eq(sliders.status, 'Active')
        )
      )
      .limit(1);

    if (!slider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      );
    }

    // Get only visible slides sorted by position
    const sliderSlides = await db
      .select()
      .from(slides)
      .where(
        and(
          eq(slides.slider_id, slider.id),
          eq(slides.visible, true)
        )
      )
      .orderBy(asc(slides.position));

    return NextResponse.json({ ...slider, slides: sliderSlides });
  } catch (error) {
    console.error('Error in GET /api/sliders/alias/[alias]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
