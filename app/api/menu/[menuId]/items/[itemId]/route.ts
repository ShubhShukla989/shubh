import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menu_items } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/menu/:menuId/items/:itemId - Update a menu item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { menuId: string; itemId: string } }
) {
  try {
    const { itemId } = params;
    const body = await request.json();
    const { title, type, url, page_id, category_id, parent_id } = body;

    // Build update data
    const updateData: any = {
      title,
      type,
      updated_at: new Date().toISOString(),
    };

    if (type === 'external' && url) {
      updateData.url = url;
      updateData.page_id = null;
      updateData.category_id = null;
    } else if (type === 'page' && page_id) {
      updateData.page_id = parseInt(page_id);
      updateData.url = null;
      updateData.category_id = null;
    } else if (type === 'epaper_category' && category_id) {
      updateData.category_id = parseInt(category_id);
      updateData.url = null;
      updateData.page_id = null;
    } else if (type === 'epaper_archive') {
      updateData.url = null;
      updateData.page_id = null;
      updateData.category_id = null;
    }

    if (parent_id) {
      updateData.parent_id = parseInt(parent_id);
    } else {
      updateData.parent_id = null;
    }

    // Update menu item
    const [data] = await db
      .update(menu_items)
      .set(updateData)
      .where(eq(menu_items.id, parseInt(itemId)))
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu/:menuId/items/:itemId - Delete a menu item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { menuId: string; itemId: string } }
) {
  try {
    const { itemId } = params;

    await db.delete(menu_items).where(eq(menu_items.id, parseInt(itemId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
