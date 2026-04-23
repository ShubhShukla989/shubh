import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_clips, editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { clipId: string } }
) {
  try {
    const { clipId } = params;

    if (!clipId) {
      return NextResponse.json(
        { success: false, error: 'Clip ID is required' },
        { status: 400 }
      );
    }

    // Fetch clip from database
    const [clip] = await db
      .select()
      .from(epaper_clips)
      .where(eq(epaper_clips.id, parseInt(clipId)))
      .limit(1);

    if (!clip) {
      return NextResponse.json(
        { success: false, error: 'Clip not found' },
        { status: 404 }
      );
    }

    // Fetch edition details
    const [edition] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, clip.edition_id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        ...clip,
        edition: edition || null
      }
    });
  } catch (error) {
    console.error('Error fetching clip:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
