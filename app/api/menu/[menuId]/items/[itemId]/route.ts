import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Build update data
    const updateData: any = {
      title,
      type,
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
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Delete menu item from menu_items table
    const { error } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
