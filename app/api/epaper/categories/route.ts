import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema/categories';
import { eq, asc, and } from 'drizzle-orm';
import { validateRequest } from '@/lib/api-validation';
import { categorySchema } from '@/lib/validations/category';
import { withCache, invalidateCacheByTags } from '@/lib/cache';

// Cache configuration for categories - EXTREME performance for 1000+ users
const CACHE_CONFIG = {
  ttl: 3600, // 1 hour for categories (change less frequently)
  tags: ['categories'],
};

// GET all categories with caching
async function getCategoriesHandler(request: NextRequest) {
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

// Apply caching middleware to GET requests
export const GET = withCache(getCategoriesHandler, CACHE_CONFIG);

// POST create new category with validation and cache invalidation
export const POST = validateRequest(categorySchema, async (validatedData) => {
  try {
    const [data] = await db
      .insert(epaper_categories)
      .values({
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning();

    // Invalidate categories cache
    invalidateCacheByTags(['categories']);

    return NextResponse.json({
      success: true,
      data,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('alias')) {
        return NextResponse.json(
          { success: false, error: 'A category with this alias already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
});
