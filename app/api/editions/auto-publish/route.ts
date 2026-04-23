import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions } from '@/lib/schema';
import { eq, and, lte } from 'drizzle-orm';

// This endpoint checks for scheduled editions that should be published
export async function POST() {
  try {
    const now = new Date().toISOString();

    // Find editions that are scheduled and past their scheduled date
    const scheduledEditions = await db
      .select()
      .from(editions)
      .where(
        and(
          eq(editions.status, 'scheduled'),
          lte(editions.scheduled_date, now)
        )
      );

    if (scheduledEditions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No editions to publish',
        published: 0,
      });
    }

    // Update all to published
    for (const edition of scheduledEditions) {
      await db
        .update(editions)
        .set({ status: 'published' })
        .where(eq(editions.id, edition.id));
    }

    return NextResponse.json({
      success: true,
      message: `Published ${scheduledEditions.length} edition(s)`,
      published: scheduledEditions.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to auto-publish editions' },
      { status: 500 }
    );
  }
}
