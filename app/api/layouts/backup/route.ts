import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { layout_backups } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// POST /api/layouts/backup - Create backup of current layouts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { layout_name, structure, custom_css, custom_js } = body;

    if (!layout_name) {
      return NextResponse.json(
        { success: false, error: 'Layout name is required' },
        { status: 400 }
      );
    }

    const structureStr = typeof structure === 'string' ? structure : JSON.stringify(structure);

    const [data] = await db
      .insert(layout_backups)
      .values({
        id: uuidv4(),
        layout_name,
        structure: structureStr,
        timestamp: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[POST /api/layouts/backup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// GET /api/layouts/backup - Get all backups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutName = searchParams.get('layout_name');

    let data;
    if (layoutName) {
      data = await db
        .select()
        .from(layout_backups)
        .where(eq(layout_backups.layout_name, layoutName))
        .orderBy(desc(layout_backups.timestamp));
    } else {
      data = await db
        .select()
        .from(layout_backups)
        .orderBy(desc(layout_backups.timestamp));
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/layouts/backup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}
