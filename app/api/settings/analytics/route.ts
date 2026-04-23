import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateCacheKeysAsync } from '@/lib/cache/universal';

// GET /api/settings/analytics - Get Google Analytics measurement ID
export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'analytics_measurement_id'))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: { measurement_id: data?.value || '' },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/analytics - Save Google Analytics measurement ID
export async function POST(request: NextRequest) {
  try {
    const { measurement_id } = await request.json();

    // Check if exists
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'analytics_measurement_id'))
      .limit(1);

    if (existing) {
      await db
        .update(settings)
        .set({
          value: measurement_id || '',
          updated_at: new Date().toISOString()
        })
        .where(eq(settings.key, 'analytics_measurement_id'));
    } else {
      await db
        .insert(settings)
        .values({
          key: 'analytics_measurement_id',
          value: measurement_id || ''
        });
    }

    invalidateCacheKeysAsync(['layout:*']);
    revalidatePath('/', 'page');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save analytics settings' },
      { status: 500 }
    );
  }
}
