import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { layout_backups } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/layouts/download/[id] - Download specific backup
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [data] = await db
      .select()
      .from(layout_backups)
      .where(eq(layout_backups.id, params.id))
      .limit(1);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Backup not found' },
        { status: 404 }
      );
    }

    // Return as downloadable JSON
    const filename = `${data.layout_name}-backup-${data.timestamp}.json`;
    
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/layouts/download/:id] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}
