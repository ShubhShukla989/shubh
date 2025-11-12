import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const { id, pageId } = params;
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get existing page
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

    // Delete old image from storage
    const oldUrlParts = page.image_url.split('/');
    const oldFileName = oldUrlParts[oldUrlParts.length - 1];
    await supabaseAdmin.storage
      .from('page-assets')
      .remove([oldFileName]);

    // Upload new image
    const imageBuffer = await image.arrayBuffer();
    const fileName = `edition-${id}-page-${page.page_number}-${Date.now()}.${image.type.split('/')[1]}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('page-assets')
      .upload(fileName, imageBuffer, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get new public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('page-assets')
      .getPublicUrl(fileName);

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from('edition_pages')
      .update({ image_url: urlData.publicUrl })
      .eq('id', pageId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Page replaced successfully',
      data: { image_url: urlData.publicUrl },
    });
  } catch (error) {
    console.error('Replace page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to replace page' },
      { status: 500 }
    );
  }
}
