import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { edition_pages } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/editions/[id]/pages/upload-image
 * Upload JPG/PNG images as edition pages
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const pageNumber = parseInt(formData.get('page_number') as string);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory
    const mediaPath = process.env.MEDIA_PATH || './public/uploads';
    const dirPath = join(mediaPath, 'page-assets');
    await mkdir(dirPath, { recursive: true });

    // Generate filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `edition-${editionId}-page-${pageNumber}.${fileExtension}`;
    const filePath = join(dirPath, fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Generate public URL
    const imageUrl = `/uploads/page-assets/${fileName}`;

    // Check if page already exists for this page number
    const existingPage = await db
      .select()
      .from(edition_pages)
      .where(
        and(
          eq(edition_pages.edition_id, editionId),
          eq(edition_pages.page_number, pageNumber)
        )
      )
      .limit(1);

    let pageData;

    if (existingPage.length > 0) {
      // Update existing page
      [pageData] = await db
        .update(edition_pages)
        .set({
          image_url: imageUrl,
        })
        .where(eq(edition_pages.id, existingPage[0].id))
        .returning();
    } else {
      // Create new page
      [pageData] = await db
        .insert(edition_pages)
        .values({
          edition_id: editionId,
          page_number: pageNumber,
          image_url: imageUrl,
          title: `Page ${pageNumber}`,
          created_at: new Date().toISOString(),
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      data: {
        page: pageData,
        image_url: imageUrl,
        file_name: file.name,
        file_size: buffer.length,
      },
    });

  } catch (error) {
    console.error('Upload image error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}