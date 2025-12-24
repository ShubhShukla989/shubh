import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media_tags } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

// GET all tags
export async function GET() {
  try {
    const data = await db
      .select()
      .from(media_tags)
      .orderBy(asc(media_tags.name));

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST create new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tag name is required' 
      }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [data] = await db
      .insert(media_tags)
      .values({ name: name.trim(), slug })
      .returning();

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Create tag error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create tag' 
    }, { status: 500 });
  }
}

// DELETE tag
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    await db
      .delete(media_tags)
      .where(eq(media_tags.id, parseInt(id)));

    return NextResponse.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete tag' }, { status: 500 });
  }
}
