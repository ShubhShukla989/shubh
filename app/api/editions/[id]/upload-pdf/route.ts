import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use default media path if not configured
    const mediaPath = process.env.MEDIA_PATH || './public/uploads';
    const pdfDir = join(mediaPath, 'editions');
    await mkdir(pdfDir, { recursive: true });

    // Save to file system
    const fileName = `edition-${editionId}-${Date.now()}.pdf`;
    const filePath = join(pdfDir, fileName);
    await writeFile(filePath, buffer);

    // Construct URL (matching the media path structure)
    const pdfUrl = `/uploads/editions/${fileName}`;

    // Update edition with PDF URL
    await db
      .update(editions)
      .set({ pdf_url: pdfUrl })
      .where(eq(editions.id, editionId));

    return NextResponse.json({
      success: true,
      data: { pdf_url: pdfUrl, file_name: file.name },
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload PDF' },
      { status: 500 }
    );
  }
}
