import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [data] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, parseInt(params.id)))
      .limit(1);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get edition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch edition' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate and normalize status if present
    if (body.status) {
      const normalizedStatus = body.status.toLowerCase();
      const validStatuses = ['draft', 'processing', 'published', 'scheduled'];
      
      if (!validStatuses.includes(normalizedStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      
      body.status = normalizedStatus;
    }

    // Handle scheduled_date - allow null to clear it
    if ('scheduled_date' in body) {
      if (body.scheduled_date === null || body.scheduled_date === '') {
        body.scheduled_date = null;
      }
    }

    const [data] = await db
      .update(editions)
      .set({ ...body, updated_at: new Date().toISOString() })
      .where(eq(editions.id, parseInt(params.id)))
      .returning();

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update edition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update edition' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db
      .delete(editions)
      .where(eq(editions.id, parseInt(params.id)));

    return NextResponse.json({
      success: true,
      message: 'Edition deleted successfully',
    });
  } catch (error) {
    console.error('Delete edition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete edition' },
      { status: 500 }
    );
  }
}
