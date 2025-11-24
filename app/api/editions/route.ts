import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, requireSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category_id');

    // Build query
    let query = supabaseAdmin!
      .from('editions')
      .select(`
        *,
        pages:edition_pages(
          id,
          page_number,
          image_url
        )
      `)
      .order('date', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (categoryId) {
      query = query.eq('category_id', parseInt(categoryId));
    }

    const { data, error } = await query;

    if (error) throw error;

    // Sort pages by page_number for each edition
    const processedData = data?.map(edition => ({
      ...edition,
      pages: edition.pages?.sort((a: any, b: any) => a.page_number - b.page_number) || []
    }));

    return NextResponse.json({ success: true, data: processedData });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[GET /api/editions] Error:', error.message);
    } else {
      console.error('[GET /api/editions] Unknown error:', error);
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch editions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const configError = requireSupabaseAdmin();
    if (configError) return configError;

    const raw = await request.json();

    // Normalize and validate payload against schema
    const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null;
    const alias = typeof raw.alias === 'string' && raw.alias.trim() ? raw.alias.trim() : null;
    const date = typeof raw.date === 'string' && raw.date.trim() ? raw.date.trim() : null; // expects YYYY-MM-DD
    const category_id = raw.category_id ? Number(raw.category_id) : null;
    const description = typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : null;
    const validStatuses = ['draft', 'processing', 'published', 'scheduled'];
    const normalizedStatus = raw.status ? raw.status.toLowerCase() : 'draft';
    const status = validStatuses.includes(normalizedStatus) ? normalizedStatus : 'draft';
    const pdf_url = typeof raw.pdf_url === 'string' && raw.pdf_url.trim() ? raw.pdf_url.trim() : null;
    const scheduled_date = raw.scheduled_date && typeof raw.scheduled_date === 'string' ? raw.scheduled_date : null;
    const seo_h1 = typeof raw.seo_h1 === 'string' && raw.seo_h1.trim() ? raw.seo_h1.trim() : null;
    const seo_meta_description = typeof raw.seo_meta_description === 'string' && raw.seo_meta_description.trim() ? raw.seo_meta_description.trim() : null;

    if (!title || !date) {
      return NextResponse.json(
        { success: false, error: 'Validation error: title and date are required' },
        { status: 400 }
      );
    }

    const insertPayload = {
      title,
      alias,
      date, // Supabase will coerce to DATE
      category_id,
      description,
      status,
      pdf_url,
      scheduled_date,
      seo_h1,
      seo_meta_description,
    } as const;

    console.log('[POST /api/editions] Insert payload:', insertPayload);

    const { data, error } = await supabaseAdmin!
      .from('editions')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error('[POST /api/editions] Database error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error('[POST /api/editions] Error:', error.message);
    } else {
      console.error('[POST /api/editions] Unknown error:', error);
    }
    const message = error instanceof Error ? error.message : 'Failed to create edition';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
