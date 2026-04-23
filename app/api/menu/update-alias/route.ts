import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menus } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/menu/update-alias - Update menu items when page alias changes
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldAlias, newAlias } = body;

    if (!oldAlias || !newAlias) {
      return NextResponse.json(
        { error: 'Old and new alias are required' },
        { status: 400 }
      );
    }

    // Get all menus
    const allMenus = await db.select().from(menus);

    // Update items in each menu
    let updatedCount = 0;
    for (const menu of allMenus || []) {
      const items = JSON.parse(menu.items || '[]');
      let hasChanges = false;

      const updatedItems = items.map((item: any) => {
        if (item.alias === oldAlias || item.url === `/page/${oldAlias}`) {
          hasChanges = true;
          updatedCount++;
          return {
            ...item,
            alias: newAlias,
            url: `/page/${newAlias}`,
          };
        }
        return item;
      });

      if (hasChanges) {
        await db
          .update(menus)
          .set({
            items: JSON.stringify(updatedItems),
            updated_at: new Date().toISOString(),
          })
          .where(eq(menus.id, menu.id));
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} menu item(s)`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
