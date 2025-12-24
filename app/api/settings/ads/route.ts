import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/settings/ads - Get ads.txt content
export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'ads_txt'))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: { content: data?.value || '' },
    });
  } catch (error) {
    console.error('Get ads.txt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ads.txt' },
      { status: 500 }
    );
  }
}

// POST /api/settings/ads - Save ads.txt content
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    // Check if exists
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'ads_txt'))
      .limit(1);

    if (existing) {
      await db
        .update(settings)
        .set({
          value: content || '',
          updated_at: new Date().toISOString()
        })
        .where(eq(settings.key, 'ads_txt'));
    } else {
      await db
        .insert(settings)
        .values({
          key: 'ads_txt',
          value: content || ''
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save ads.txt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save ads.txt' },
      { status: 500 }
    );
  }
}
