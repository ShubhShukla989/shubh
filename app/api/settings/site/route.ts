import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || { setting_value: 'website-homepage', homepage_layout: '' }
    });
  } catch (error: any) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();
    const { home_page, homepage_layout, homepage_type, site_header_layout, site_footer_layout, default_category_id } = body;

    if (!home_page) {
      return NextResponse.json(
        { success: false, error: 'home_page is required' },
        { status: 400 }
      );
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .single();

    let result;
    if (existing) {
      // Update existing record
      result = await supabase
        .from('site_settings')
        .update({
          setting_value: home_page,
          homepage_layout: homepage_layout || null,
          homepage_type: homepage_type || 'normal',
          site_header_layout: site_header_layout || null,
          site_footer_layout: site_footer_layout || null,
          default_category_id: default_category_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new record
      result = await supabase
        .from('site_settings')
        .insert({
          setting_value: home_page,
          homepage_layout: homepage_layout || null,
          homepage_type: homepage_type || 'normal',
          site_header_layout: site_header_layout || null,
          site_footer_layout: site_footer_layout || null,
          default_category_id: default_category_id || null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.error('Error saving site settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
