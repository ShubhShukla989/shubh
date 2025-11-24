import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const fileId = params.id;

    console.log('🗑️ Deleting media file:', fileId);

    // Get file info first
    const { data: fileInfo, error: fetchError } = await supabaseAdmin
      .from('media_files')
      .select('file_path')
      .eq('id', fileId)
      .single();

    if (fetchError || !fileInfo) {
      console.error('File not found:', fetchError);
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('page-assets')
      .remove([fileInfo.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue anyway - database record is more important
    }

    // Delete from database (this will cascade delete tags via foreign key)
    const { error: dbError } = await supabaseAdmin
      .from('media_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete from database' },
        { status: 500 }
      );
    }

    console.log('✅ Media file deleted:', fileId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
