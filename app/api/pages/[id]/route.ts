import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/pages/:id - Get a single page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
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
 * PUT /api/pages/:id - Update a page
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
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

    // Check if alias exists for another page
    const { data: existing } = await supabaseAdmin
      .from('pages')
      .select('id')
      .eq('alias', alias)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Alias already exists' },
        { status: 400 }
      );
    }

    // Update page
    const { data, error } = await supabaseAdmin
      .from('pages')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
 * DELETE /api/pages/:id - Delete a page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin.from('pages').delete().eq('id', id);

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
