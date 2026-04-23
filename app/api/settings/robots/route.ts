import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// GET /api/settings/robots - Get robots.txt content
export async function GET() {
  try {
    const [data] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'robots_txt'))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: { content: data?.value || '' },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch robots.txt' },
      { status: 500 }
    );
  }
}

// POST /api/settings/robots - Save robots.txt content
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    // Check if exists
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'robots_txt'))
      .limit(1);

    if (existing) {
      await db
        .update(settings)
        .set({
          value: content || '',
          updated_at: new Date().toISOString()
        })
        .where(eq(settings.key, 'robots_txt'));
    } else {
      await db
        .insert(settings)
        .values({
          key: 'robots_txt',
          value: content || ''
        });
    }

    revalidatePath('/robots.txt', 'page');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save robots.txt' },
      { status: 500 }
    );
  }
}
