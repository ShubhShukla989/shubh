import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get all menus
    const { data: menus, error: menusError } = await supabaseAdmin
      .from('menus')
      .select('*');

    if (menusError) {
      console.error('Database error:', menusError);
      return NextResponse.json({ error: menusError.message }, { status: 500 });
    }

    // Update items in each menu
    let updatedCount = 0;
    for (const menu of menus || []) {
      const items = menu.items || [];
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
        await supabaseAdmin
          .from('menus')
          .update({
            items: updatedItems,
            updated_at: new Date().toISOString(),
          })
          .eq('id', menu.id);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} menu item(s)`,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
