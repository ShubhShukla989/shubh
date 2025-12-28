import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions } from '@/lib/schema/editions';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/editions/[id]/title - Get edition title by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    
    if (isNaN(editionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid edition ID' },
        { status: 400 }
      );
    }

    const [edition] = await db
      .select({ title: editions.title })
      .from(editions)
      .where(eq(editions.id, editionId))
      .limit(1);

    if (!edition) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      title: edition.title 
    });
  } catch (error) {
    console.error('[GET /api/editions/:id/title] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch edition title' },
      { status: 500 }
    );
  }
}