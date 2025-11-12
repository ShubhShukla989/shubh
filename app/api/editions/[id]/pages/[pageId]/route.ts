import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const { id, pageId } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('edition_pages')
      .select('*')
      .eq('id', pageId)
      .eq('edition_id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const { id, pageId } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get page details
    const { data: page, error: fetchError } = await supabaseAdmin
      .from('edition_pages')
      .select('*')
      .eq('id', pageId)
      .eq('edition_id', id)
      .single();

    if (fetchError || !page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Extract filename from URL
    const urlParts = page.image_url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // Delete from storage
    const { error: deleteStorageError } = await supabaseAdmin.storage
      .from('page-assets')
      .remove([fileName]);

    if (deleteStorageError) {
      console.error('Storage delete error:', deleteStorageError);
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('edition_pages')
      .delete()
      .eq('id', pageId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
