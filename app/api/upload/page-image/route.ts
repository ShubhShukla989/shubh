import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json(
        { success: false, error: 'File and path are required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local file system
    const mediaPath = process.env.MEDIA_PATH || './public/media';
    const fullPath = join(mediaPath, 'page-assets', path);
    const dirPath = dirname(fullPath);

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });

    // Write file
    await writeFile(fullPath, buffer);

    // Generate public URL
    const publicUrl = `/media/page-assets/${path}`;

    return NextResponse.json({
      success: true,
      data: {
        path: path,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error('[POST /api/upload/page-image] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
