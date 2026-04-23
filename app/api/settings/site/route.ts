import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { site_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getCached, setCache, deleteCachePattern } from '@/lib/cache/redis';

export async function GET() {
  try {
    const cacheKey = 'settings:site:home_page';
    
    // Try Redis cache first
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      });
    }
    
    // Cache miss - fetch from database (silent)
    const [data] = await db
      .select()
      .from(site_settings)
      .where(eq(site_settings.setting_key, 'home_page'))
      .limit(1);

    const result = data || { 
      setting_value: 'website-homepage', 
      homepage_layout: '' 
    };

    // Cache for 1 hour
    await setCache(cacheKey, result, 3600);

    return NextResponse.json({
      success: true,
      data: result,
      cached: false
    });
  } catch (error: any) {
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

    // ✅ PHASE 1: Cache Invalidation for Settings
    try {
      // Clear settings cache
      await deleteCachePattern('settings:*');
      
      // Clear all layout caches (settings affect which layouts are used)
      await deleteCachePattern('layout:*');
      
      console.log('✅ Redis cache cleared for settings and layouts');
    } catch (error) {
      console.error('⚠️ Failed to clear Redis cache:', error);
      // Continue anyway - not critical
    }
    
    // ✅ Revalidate pages
    try {
      // Revalidate all pages that use layouts
      revalidateTag('layout');
      revalidateTag('settings');
      
      // Revalidate homepage (settings change affects homepage)
      revalidatePath('/', 'page');
      
      console.log('✅ Next.js pages revalidated for settings update');
    } catch (error) {
      console.error('⚠️ Failed to revalidate pages:', error);
      // Continue anyway - not critical
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Settings updated successfully.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
