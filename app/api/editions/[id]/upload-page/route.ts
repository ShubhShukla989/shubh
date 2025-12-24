import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { db } from '@/lib/db';
import { edition_pages } from '@/lib/schema';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData = await request.formData();
    
    const imageFile = formData.get('image') as File;
    const pageNumber = parseInt(formData.get('pageNumber') as string);
    const editionId = parseInt(formData.get('editionId') as string);

    if (!imageFile || !pageNumber || !editionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Setup output directory
    const mediaPath = process.env.MEDIA_PATH || './public/uploads';
    const outputDir = join(mediaPath, 'page-assets');
    await mkdir(outputDir, { recursive: true });

    // Save image file
    const fileName = `edition-${id}-page-${pageNumber}.png`;
    const imagePath = join(outputDir, fileName);
    
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    await writeFile(imagePath, imageBuffer);

    // Create database record
    const [pageData] = await db
      .insert(edition_pages)
      .values({
        edition_id: editionId,
        page_number: pageNumber,
        image_url: `/uploads/page-assets/${fileName}`,
      })
      .returning();

    return NextResponse.json({
      success: true,
      page: pageData,
    });

  } catch (error) {
    console.error('Upload page error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload page' },
      { status: 500 }
    );
  }
}