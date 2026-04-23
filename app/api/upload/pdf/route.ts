import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `editions/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local file system
    const mediaPath = process.env.MEDIA_PATH || './public/uploads';
    const fullPath = join(mediaPath, filePath);
    const dirPath = join(mediaPath, 'editions');

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });

    // Write file
    await writeFile(fullPath, buffer);

    // Generate public URL - use uploads path to match MEDIA_PATH
    const publicUrl = `/uploads/${filePath}`;

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
