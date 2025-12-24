import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);

    // Get edition to find PDF file path
    const [edition] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, editionId))
      .limit(1);

    if (!edition) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    if (!edition.pdf_url) {
      return NextResponse.json(
        { success: false, error: 'No PDF to delete' },
        { status: 400 }
      );
    }

    // Delete from file system if MEDIA_PATH is set
    if (process.env.MEDIA_PATH) {
      try {
        const urlParts = edition.pdf_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = join(process.env.MEDIA_PATH, 'pdfs', fileName);
        await unlink(filePath);
      } catch (error) {
        console.error('File delete error:', error);
        // Continue anyway to clear the database reference
      }
    }

    // Update edition to remove PDF URL
    await db
      .update(editions)
      .set({ pdf_url: null })
      .where(eq(editions.id, editionId));

    return NextResponse.json({
      success: true,
      message: 'PDF deleted successfully',
    });
  } catch (error) {
    console.error('Delete PDF error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete PDF' },
      { status: 500 }
    );
  }
}
