import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const title = formData.get('title') as string;
    const altText = formData.get('alt_text') as string;
    const tagIds = formData.get('tag_ids') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} is not an image` },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} is too large. Max size is 10MB` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = `media/${fileName}`;

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('page-assets')
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
          { success: false, error: `Failed to upload ${file.name}: ${error.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('page-assets')
        .getPublicUrl(filePath);

      // Save to database
      const { data: dbFile, error: dbError } = await supabaseAdmin
        .from('media_files')
        .insert({
          filename: fileName,
          original_name: file.name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          title: title || file.name,
          alt_text: altText || '',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Add tags if provided
      if (dbFile && tagIds) {
        const tagIdArray = tagIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (tagIdArray.length > 0) {
          const tagInserts = tagIdArray.map(tagId => ({
            media_file_id: dbFile.id,
            media_tag_id: tagId,
          }));

          await supabaseAdmin
            .from('media_file_tags')
            .insert(tagInserts);
        }
      }

      uploadedFiles.push({
        id: dbFile?.id || fileName,
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data: uploadedFiles }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Configure body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
