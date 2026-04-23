import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Increase body size limit for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// Allow up to 50MB
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, error: 'Only PDF files are allowed' }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `editions/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        path: filePath,
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload PDF';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
