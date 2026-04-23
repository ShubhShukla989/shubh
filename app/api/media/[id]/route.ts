import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media_files } from '@/lib/schema/media';
import { eq } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join, resolve, basename } from 'path';
import { existsSync } from 'fs';

function getUploadDir(): string {
  return process.env.UPLOAD_DIR
    ? resolve(process.env.UPLOAD_DIR)
    : join(process.cwd(), 'public', 'uploads');
}

// DELETE /api/media/[id] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);
    
    if (isNaN(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // Get file info before deleting
    const [file] = await db.select().from(media_files).where(eq(media_files.id, fileId));
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await db.delete(media_files).where(eq(media_files.id, fileId));

    // Delete physical file using UPLOAD_DIR env var (not process.cwd())
    try {
      const uploadDir = getUploadDir();
      const filename = basename(file.file_url); // extract just the filename
      const filePath = join(uploadDir, filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (fileError) {
      console.warn('Failed to delete physical file:', fileError);
      // Continue even if physical file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}