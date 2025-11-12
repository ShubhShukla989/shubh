import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get menu by alias
    const { data: menu, error: menuError } = await supabaseAdmin
      .from('menus')
      .select('*')
      .eq('alias', alias)
      .single();

    if (menuError || !menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    // Get menu items with page information
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('menu_items')
      .select(`
        *,
        pages!left(id, alias, title)
      `)
      .eq('menu_id', menu.id)
      .order('position');

    if (itemsError) {
      console.error('Database error:', itemsError);
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

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
