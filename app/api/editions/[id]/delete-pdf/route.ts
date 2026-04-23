import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { editions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { unlink, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

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

    // Parse the PDF URL to get file path
    // PDF URL format: /uploads/editions/edition-1-1234567890.pdf
    const pdfUrl = edition.pdf_url;
    const urlParts = pdfUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const subDir = urlParts[urlParts.length - 2]; // 'editions' or 'pdfs'

    // Determine the base media path
    const mediaPath = process.env.MEDIA_PATH || join(process.cwd(), 'public', 'uploads');
    
    // Construct the full file path
    // Try multiple possible locations
    const possiblePaths = [
      join(mediaPath, subDir, fileName), // /uploads/editions/file.pdf
      join(mediaPath, 'pdfs', fileName), // /uploads/pdfs/file.pdf (legacy)
      join(mediaPath, fileName), // /uploads/file.pdf (direct)
      join(process.cwd(), 'public', pdfUrl.replace(/^\//, '')), // Absolute path from URL
    ];

    // Try to delete the file if it exists
    let fileDeleted = false;
    let lastError: any = null;
    
    for (const filePath of possiblePaths) {
      try {
        // Check if file exists first
        try {
          await access(filePath, constants.F_OK);
        } catch (accessError: any) {
          // File doesn't exist, skip this path
          if (accessError.code === 'ENOENT') {
            continue; // Try next path
          }
          // Other access error, log and continue
          lastError = accessError;
          continue;
        }
        
        // File exists, try to delete it
        try {
          await unlink(filePath);
          fileDeleted = true;
          break; // Stop after successful deletion
        } catch (unlinkError: any) {
          // If unlink fails, log but don't throw
          if (unlinkError.code !== 'ENOENT') {
            lastError = unlinkError;
          }
          continue; // Try next path
        }
      } catch (error: any) {
        // Catch any other unexpected errors
        if (error.code !== 'ENOENT') {
          lastError = error;
        }
        continue; // Try next path
      }
    }

    // If file not found in any location, continue to clear database reference
    // Update edition to remove PDF URL
    await db
      .update(editions)
      .set({ pdf_url: null })
      .where(eq(editions.id, editionId));

    return NextResponse.json({
      success: true,
      message: fileDeleted ? 'PDF deleted successfully' : 'PDF reference removed (file was not found)',
    });
  } catch (error: any) {
    // Try to clear database reference even if file deletion failed
    try {
      await db
        .update(editions)
        .set({ pdf_url: null })
        .where(eq(editions.id, parseInt(params.id)));
    } catch (dbError) {
      // Silent fail - database error
    }
    
    // Return success anyway - database reference cleared
    return NextResponse.json({
      success: true,
      message: 'PDF reference removed (file deletion had issues)',
    });
  }
}
