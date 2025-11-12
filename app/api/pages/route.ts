import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/pages - List all pages with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    let query = supabaseAdmin.from('pages').select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,alias.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      pages: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pages - Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, alias, description, content, status, seo } = body;

    if (!title || !alias) {
      return NextResponse.json(
        { error: 'Title and alias are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if alias already exists
    const { data: existing } = await supabaseAdmin
      .from('pages')
      .select('id')
      .eq('alias', alias)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Alias already exists' },
        { status: 400 }
      );
    }

    // Create page
    const { data, error } = await supabaseAdmin
      .from('pages')
      .insert({
        title,
        alias,
        description: description || null,
        content: content || null,
        status: status || 'Draft',
        meta_title: seo?.customTitle || null,
        meta_description: seo?.metaDescription || null,
        meta_keywords: seo?.metaKeywords || null,
        og_image: seo?.ogImage || null,
        twitter_title: seo?.twitterTitle || null,
        twitter_description: seo?.twitterDescription || null,
        twitter_image: seo?.twitterImage || null,
        header_code: seo?.headerCode || null,
        footer_code: seo?.footerCode || null,
      })
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
