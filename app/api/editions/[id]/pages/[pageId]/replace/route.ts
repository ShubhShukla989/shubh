import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { edition_pages } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/editions/[id]/pages/[pageId]/replace
 * Replace an existing page image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const pageId = parseInt(params.pageId);
    const formData = await request.formData();
    const file = formData.get('image') as File;

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

    // Get existing page data
    const [existingPage] = await db
      .select()
      .from(edition_pages)
      .where(eq(edition_pages.id, pageId))
      .limit(1);

    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory
    const mediaPath = process.env.MEDIA_PATH || './public/uploads';
    const dirPath = join(mediaPath, 'page-assets');
    await mkdir(dirPath, { recursive: true });

    // Generate new filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `edition-${editionId}-page-${existingPage.page_number}-${Date.now()}.${fileExtension}`;
    const filePath = join(dirPath, fileName);

    // Save new file
    await writeFile(filePath, buffer);

    // Delete old file if it exists
    if (existingPage.image_url) {
      try {
        const oldFileName = existingPage.image_url.split('/').pop();
        if (oldFileName) {
          const oldFilePath = join(dirPath, oldFileName);
          await unlink(oldFilePath).catch(() => {}); // Ignore errors if file doesn't exist
        }
      } catch (deleteError) {
        console.error('Failed to delete old image:', deleteError);
        // Continue anyway - new image is more important
      }
    }

    // Generate public URL
    const imageUrl = `/uploads/page-assets/${fileName}`;

    // Update page in database
    const [updatedPage] = await db
      .update(edition_pages)
      .set({
        image_url: imageUrl,
      })
      .where(eq(edition_pages.id, pageId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        page: updatedPage,
        image_url: imageUrl,
        file_name: file.name,
        file_size: buffer.length,
      },
    });

  } catch (error) {
    console.error('Replace page error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to replace page: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}