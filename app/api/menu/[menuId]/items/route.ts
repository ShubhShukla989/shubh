import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menu_items, pages } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/menu/:menuId/items - Get all menu items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;

    const data = await db
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
      .where(eq(menu_items.menu_id, parseInt(menuId)))
      .orderBy(asc(menu_items.position));

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menu/:menuId/items - Add a menu item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;
    const body = await request.json();
    const { title, type, url, page_id, category_id, position } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create menu item
    const itemData: any = {
      menu_id: parseInt(menuId),
      title,
      type: type || 'external',
      position: position || 0,
    };

    if (type === 'external' && url) {
      itemData.url = url;
    } else if (type === 'page' && page_id) {
      itemData.page_id = parseInt(page_id);
    } else if (type === 'epaper_category' && category_id) {
      itemData.category_id = parseInt(category_id);
    }

    const [data] = await db.insert(menu_items).values(itemData).returning();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
