import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema/categories';
import { eq, asc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateCacheKeysAsync } from '@/lib/cache/universal';

// Disable Next.js caching for categories
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    return NextResponse.json({ success: true, data: data || [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// Apply caching middleware to GET requests - DISABLED FOR ADMIN PANEL
// export const GET = withCache(getCategoriesHandler, CACHE_CONFIG);

// Direct handler without caching for admin panel
export async function GET(request: NextRequest) {
  return getCategoriesHandler(request);
}

// POST create new category with validation and cache invalidation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Simple validation - only require title
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category title is required' },
        { status: 400 }
      );
    }

    // Generate alias from title if not provided
    let alias = body.alias;
    if (!alias) {
      alias = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }

    // Validate alias format
    if (!/^[a-z0-9-]+$/.test(alias) || alias.startsWith('-') || alias.endsWith('-')) {
      return NextResponse.json(
        { success: false, error: 'Invalid alias format. Use only lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

    const categoryData = {
      title: body.title.trim(),
      alias: alias,
      description: body.description || null,
      parent_id: body.parent_id ? parseInt(body.parent_id) : null,
      image_url: body.image_url || null,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      meta_keywords: body.meta_keywords || null,
      robots: body.robots || 'index, follow',
      is_active: body.is_active !== false, // Default to true
      is_featured: body.is_featured === true, // Default to false
      display_order: body.display_order ? parseInt(body.display_order) : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const [data] = await db
      .insert(epaper_categories)
      .values(categoryData)
      .returning();

    // Invalidate categories cache
    invalidateCacheKeysAsync(['categories:*', 'epaper:editions-by-category:*', 'editions:latest-by-categories:*', 'layout:compiled:*']);
    revalidatePath('/epaper', 'page');

    return NextResponse.json({
      success: true,
      data,
      message: 'Category created successfully',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('alias')) {
        return NextResponse.json(
          { success: false, error: 'A category with this alias already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('title')) {
        return NextResponse.json(
          { success: false, error: 'A category with this title already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
