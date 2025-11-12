import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
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

    // Get edition to find PDF file path
    const { data: edition, error: editionError } = await supabaseAdmin
      .from('editions')
      .select('pdf_url')
      .eq('id', id)
      .single();

    if (editionError || !edition) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    if (!edition.pdf_url) {
      return NextResponse.json(
        { success: false, error: 'No PDF to delete' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    const urlParts = edition.pdf_url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // Delete from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('edition-pdfs')
      .remove([fileName]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      // Continue anyway to clear the database reference
    }

    // Update edition to remove PDF URL
    const { error: updateError } = await supabaseAdmin
      .from('editions')
      .update({ pdf_url: null })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PDF deleted successfully',
    });
  } catch (error) {
    console.error('Delete PDF error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete PDF' },
      { status: 500 }
    );
  }
}
