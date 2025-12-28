import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema/categories';
import { eq } from 'drizzle-orm';

// Disable Next.js caching for categories
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/epaper/categories/[id] - Get category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const [category] = await db
      .select()
      .from(epaper_categories)
      .where(eq(epaper_categories.id, categoryId));

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/epaper/categories/[id] - Update category (including toggle)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};
    
    // Map all possible fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.alias !== undefined) updateData.alias = body.alias;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description;
    if (body.meta_keywords !== undefined) updateData.meta_keywords = body.meta_keywords;
    if (body.robots !== undefined) updateData.robots = body.robots;
    if (body.parent_id !== undefined) updateData.parent_id = body.parent_id;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const [updatedCategory] = await db
      .update(epaper_categories)
      .set(updateData)
      .where(eq(epaper_categories.id, categoryId))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/epaper/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const [deletedCategory] = await db
      .delete(epaper_categories)
      .where(eq(epaper_categories.id, categoryId))
      .returning();

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}