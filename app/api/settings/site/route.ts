import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { site_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(site_settings)
      .where(eq(site_settings.setting_key, 'home_page'))
      .limit(1);

    const response = NextResponse.json({
      success: true,
      data: data || { setting_value: 'website-homepage', homepage_layout: '' }
    });

    // Disable caching for this endpoint
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return response;
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
    const body = await request.json();
    const { home_page, homepage_layout, homepage_type, site_header_layout, site_footer_layout, default_category_id } = body;

    if (!home_page) {
      return NextResponse.json(
        { success: false, error: 'home_page is required' },
        { status: 400 }
      );
    }

    // Check if record exists by setting_key
    const [existing] = await db
      .select()
      .from(site_settings)
      .where(eq(site_settings.setting_key, 'home_page'))
      .limit(1);

    let data;
    if (existing) {
      // Update existing record
      [data] = await db
        .update(site_settings)
        .set({
          setting_value: home_page,
          homepage_layout: homepage_layout || null,
          homepage_type: homepage_type || 'normal',
          site_header_layout: site_header_layout || null,
          site_footer_layout: site_footer_layout || null,
          default_category_id: default_category_id || null,
          updated_at: new Date().toISOString()
        })
        .where(eq(site_settings.id, existing.id))
        .returning();
    } else {
      // Insert new record
      [data] = await db
        .insert(site_settings)
        .values({
          setting_key: 'home_page',
          setting_value: home_page,
          homepage_layout: homepage_layout || null,
          homepage_type: homepage_type || 'normal',
          site_header_layout: site_header_layout || null,
          site_footer_layout: site_footer_layout || null,
          default_category_id: default_category_id || null,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error saving site settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
