import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateCacheKeysAsync } from '@/lib/cache/universal';

export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(epaper_settings)
      .where(eq(epaper_settings.id, 1))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: data || {
        entries_per_page: 12,
        include_header_footer_map: false,
        include_header_footer_clip: false,
        default_publishing_status: 'publish-immediately',
        disable_right_click: false,
        keep_archive_days: 0,
        use_random_prefix: false,
      }
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

    // Check if settings exist
    const [existing] = await db
      .select()
      .from(epaper_settings)
      .where(eq(epaper_settings.id, 1))
      .limit(1);

    let data;
    if (existing) {
      [data] = await db
        .update(epaper_settings)
        .set({
          ...body,
          updated_at: new Date().toISOString()
        })
        .where(eq(epaper_settings.id, 1))
        .returning();
    } else {
      [data] = await db
        .insert(epaper_settings)
        .values({
          id: 1,
          ...body
        })
        .returning();
    }

    invalidateCacheKeysAsync(['settings:epaper*', 'layout:compiled:*']);
    revalidatePath('/epaper', 'page');

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
