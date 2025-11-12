import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/menu/:menuId/items - Get all menu items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('menu_id', menuId)
      .order('position');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
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

    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert([itemData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
