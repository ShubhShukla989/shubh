import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sliders, slides } from '@/lib/schema';
import { eq, ilike, desc, sql } from 'drizzle-orm';

/**
 * GET /api/sliders
 * Fetch all sliders with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query conditions
    const conditions = [];
    if (search) {
      conditions.push(ilike(sliders.title, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(sliders.status, status));
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sliders)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);

    // Get paginated data
    const offset = (page - 1) * limit;
    let data;
    
    if (conditions.length > 0) {
      data = await db
        .select()
        .from(sliders)
        .where(sql`${sql.join(conditions, sql` AND `)}`)
        .orderBy(desc(sliders.created_at))
        .limit(limit)
        .offset(offset);
    } else {
      data = await db
        .select()
        .from(sliders)
        .orderBy(desc(sliders.created_at))
        .limit(limit)
        .offset(offset);
    }

    // Get slides for each slider
    const slidersWithSlides = await Promise.all(
      data.map(async (slider) => {
        const sliderSlides = await db.select().from(slides).where(eq(slides.slider_id, slider.id));
        return { ...slider, slides: sliderSlides };
      })
    );

    return NextResponse.json({
      sliders: slidersWithSlides,
      total: countResult?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/sliders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sliders
 * Create a new slider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, alias, description, status, config } = body;

    // Validate required fields
    if (!title || !alias) {
      return NextResponse.json(
        { error: 'Title and alias are required' },
        { status: 400 }
      );
    }

    // Check if alias already exists
    const [existing] = await db
      .select()
      .from(sliders)
      .where(eq(sliders.alias, alias))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'A slider with this alias already exists' },
        { status: 400 }
      );
    }

    // Create slider
    const [data] = await db
      .insert(sliders)
      .values({
        title,
        alias,
        description,
        status: status || 'Active',
        config: config ? JSON.stringify(config) : '{}',
      })
      .returning();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sliders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
