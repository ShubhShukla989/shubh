import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET tags for a media file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('media_file_tags')
      .select('media_tag_id, media_tags(id, name, slug)')
      .eq('media_file_id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    console.log('Deleting existing tags for media_file_id:', id);
    
    // Delete existing tags
    const { error: deleteError } = await supabaseAdmin
      .from('media_file_tags')
      .delete()
      .eq('media_file_id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
    }

    // Insert new tags
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tagId: number) => ({
        media_file_id: parseInt(id),
        media_tag_id: tagId,
      }));

      console.log('Inserting tags:', tagInserts);

      const { error: insertError } = await supabaseAdmin
        .from('media_file_tags')
        .insert(tagInserts);

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
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
