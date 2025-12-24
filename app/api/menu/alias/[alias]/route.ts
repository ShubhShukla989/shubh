import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menus, menu_items, pages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/menu/alias/:alias - Get menu with items by alias
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { alias: string } }
) {
  try {
    const { alias } = params;

    // Get menu by alias
    const [menu] = await db
      .select()
      .from(menus)
      .where(eq(menus.alias, alias))
      .limit(1);

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    // Get menu items with page information
    const items = await db
      .select({
        id: menu_items.id,
        menu_id: menu_items.menu_id,
        title: menu_items.title,
        type: menu_items.type,
        url: menu_items.url,
        page_id: menu_items.page_id,
        category_id: menu_items.category_id,
        position: menu_items.position,
        parent_id: menu_items.parent_id,
        created_at: menu_items.created_at,
        updated_at: menu_items.updated_at,
        pages: pages,
      })
      .from(menu_items)
      .leftJoin(pages, eq(menu_items.page_id, pages.id))
      .where(eq(menu_items.menu_id, menu.id))
      .orderBy(asc(menu_items.position));

    const response = NextResponse.json({
      ...menu,
      items: items || [],
    });
    
    // Disable caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
