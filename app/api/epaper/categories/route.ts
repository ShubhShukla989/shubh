import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema/categories';
import { eq, asc, and } from 'drizzle-orm';

// GET all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const active = searchParams.get('active');

    let query = db.select().from(epaper_categories);
    const conditions = [];

    if (featured === 'true') {
      conditions.push(eq(epaper_categories.is_featured, true));
    }

    if (active === 'true') {
      conditions.push(eq(epaper_categories.is_active, true));
    }

    let data;
    if (conditions.length > 0) {
      data = await query.where(and(...conditions)).orderBy(asc(epaper_categories.display_order));
    } else {
      data = await query.orderBy(asc(epaper_categories.display_order));
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      alias,
      description,
      parent_id,
      image_url,
      meta_title,
      meta_description,
      meta_keywords,
      robots,
      is_active,
      is_featured,
      display_order,
    } = body;

    if (!title || !alias) {
      return NextResponse.json(
        { success: false, error: 'Title and alias are required' },
        { status: 400 }
      );
    }

    const [data] = await db
      .insert(epaper_categories)
      .values({
        title,
        alias,
        description,
        parent_id,
        image_url,
        meta_title,
        meta_description,
        meta_keywords,
        robots: robots || 'index, follow',
        is_active: is_active !== undefined ? is_active : true,
        is_featured: is_featured || false,
        display_order: display_order || 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
