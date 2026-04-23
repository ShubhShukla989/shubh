import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateWidgetCachesAsync } from '@/lib/cache/universal';

// GET /api/categories/[id] - Get category by ID
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
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category
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
    const { name, alias, status, parent_id, sort_order } = body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (alias !== undefined) updateData.alias = alias;
    if (status !== undefined) updateData.status = status;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    
    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // 🔥 UNIVERSAL CACHE INVALIDATION (Production Safe - Async)
    invalidateWidgetCachesAsync();
    
    // Revalidate Next.js routes
    try {
      revalidatePath('/', 'page'); // Homepage
      revalidatePath('/epaper', 'page'); // EPaper section
      revalidatePath('/epaper/display', 'page'); // Display page
      revalidatePath('/epaper/archive', 'page'); // Archive page
      
      // Revalidate specific category page (old and new alias)
      if (updatedCategory.alias) {
        revalidatePath(`/epaper/category/${updatedCategory.alias}`, 'page');
      }
      
      // If alias changed, also revalidate old alias page
      if (body.alias && body.alias !== updatedCategory.alias) {
        revalidatePath(`/epaper/category/${body.alias}`, 'page');
      }
      
      console.log('✅ Universal cache revalidated for category update');
    } catch (cacheError) {
      console.error('❌ Failed to revalidate cache:', cacheError);
      // Don't fail the request if cache clear fails
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
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
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // 🔥 UNIVERSAL CACHE INVALIDATION (Production Safe - Async)
    invalidateWidgetCachesAsync();
    
    // Revalidate Next.js routes
    try {
      revalidatePath('/', 'page'); // Homepage
      revalidatePath('/epaper', 'page'); // EPaper section
      revalidatePath('/epaper/display', 'page'); // Display page
      revalidatePath('/epaper/archive', 'page'); // Archive page
      
      // Revalidate the deleted category page (will show 404)
      if (deletedCategory.alias) {
        revalidatePath(`/epaper/category/${deletedCategory.alias}`, 'page');
      }
      
      console.log('✅ Universal cache revalidated for category delete');
    } catch (cacheError) {
      console.error('❌ Failed to revalidate cache:', cacheError);
      // Don't fail the request if cache clear fails
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}