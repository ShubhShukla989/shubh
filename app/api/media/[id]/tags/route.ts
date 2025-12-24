import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media_file_tags, media_tags } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET tags for a media file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const data = await db
      .select({
        media_tag_id: media_file_tags.media_tag_id,
        media_tags: media_tags,
      })
      .from(media_file_tags)
      .leftJoin(media_tags, eq(media_file_tags.media_tag_id, media_tags.id))
      .where(eq(media_file_tags.media_file_id, parseInt(id)));

    const tagIds = (data || []).map((item: any) => item.media_tag_id);

    return NextResponse.json({ success: true, data: tagIds });
  } catch (error) {
    console.error('Get media tags error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media tags' },
      { status: 500 }
    );
  }
}

// PUT update tags for a media file
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { tag_ids } = body;

    console.log('Deleting existing tags for media_file_id:', id);
    
    // Delete existing tags
    await db
      .delete(media_file_tags)
      .where(eq(media_file_tags.media_file_id, parseInt(id)));

    // Insert new tags
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tagId: number) => ({
        media_file_id: parseInt(id),
        media_tag_id: tagId,
      }));

      console.log('Inserting tags:', tagInserts);

      await db.insert(media_file_tags).values(tagInserts);
    }
    
    console.log('Tags updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Tags updated successfully',
    });
  } catch (error: any) {
    console.error('Update media tags error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update tags' },
      { status: 500 }
    );
  }
}
