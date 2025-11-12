import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET all categories
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('epaper_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      title,
      alias,
      description,
      parent_id,
      image_url,
      meta_title,
      meta_description,
      meta_keywords,
      robots,
      is_active,
      is_featured,
      display_order,
    } = body;

    if (!title || !alias) {
      return NextResponse.json(
        { success: false, error: 'Title and alias are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('epaper_categories')
      .insert({
        title,
        alias,
        description,
        parent_id,
        image_url,
        meta_title,
        meta_description,
        meta_keywords,
        robots: robots || 'index, follow',
        is_active: is_active !== undefined ? is_active : true,
        is_featured: is_featured || false,
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
