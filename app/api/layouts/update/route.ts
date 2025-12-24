import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { layouts, layout_backups } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// POST /api/layouts/update - Save or publish layout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, structure, custom_css, custom_js, status } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Layout name is required' },
        { status: 400 }
      );
    }

    const structureStr = typeof structure === 'string' ? structure : JSON.stringify(structure || { rows: [] });

    // Check if layout exists
    const [existing] = await db
      .select()
      .from(layouts)
      .where(eq(layouts.name, name))
      .limit(1);

    let data;
    if (existing) {
      // Update existing layout
      [data] = await db
        .update(layouts)
        .set({
          structure: structureStr,
          custom_css: custom_css || '',
          custom_js: custom_js || '',
          status: status || 'draft',
          updated_at: new Date().toISOString(),
        })
        .where(eq(layouts.name, name))
        .returning();
    } else {
      // Insert new layout
      [data] = await db
        .insert(layouts)
        .values({
          name,
          structure: structureStr,
          custom_css: custom_css || '',
          custom_js: custom_js || '',
          status: status || 'draft',
        })
        .returning();
    }

    // If publishing, create a backup
    if (status === 'published') {
      await db.insert(layout_backups).values({
        id: uuidv4(),
        layout_name: name,
        structure: structureStr,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[POST /api/layouts/update] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layout' },
      { status: 500 }
    );
  }
}
