import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menus } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { invalidateWidgetCachesAsync } from '@/lib/cache/universal';

/**
 * GET /api/menu/:menuId - Get a specific menu with items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;

    const [data] = await db
      .select()
      .from(menus)
      .where(eq(menus.id, parseInt(menuId)))
      .limit(1);

    if (!data) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/menu/:menuId - Update a menu
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Menu name is required' },
        { status: 400 }
      );
    }

    const [data] = await db
      .update(menus)
      .set({ name: name.trim(), updated_at: new Date().toISOString() })
      .where(eq(menus.id, parseInt(menuId)))
      .returning();

    // 🚀 UNIVERSAL CACHE INVALIDATION (Production Safe - Async)
    invalidateWidgetCachesAsync();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu/:menuId - Delete a menu
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;

    await db.delete(menus).where(eq(menus.id, parseInt(menuId)));

    // 🚀 UNIVERSAL CACHE INVALIDATION (Production Safe - Async)
    invalidateWidgetCachesAsync();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
