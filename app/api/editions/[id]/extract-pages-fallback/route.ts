import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema/index';
import { eq } from 'drizzle-orm';
import { getUploadsDir, resolvePublicPath } from '@/lib/paths';

/**
 * Fallback PDF extraction for Hostinger
 * Uses pdf-lib only (no system dependencies)
 * Returns page metadata for client-side processing
 */

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const editionId = parseInt(params.id);

    // Get edition details
    const edition = await db.select().from(editions).where(eq(editions.id, editionId)).limit(1);
    if (!edition.length || !edition[0].pdf_url) {
      return NextResponse.json({ success: false, error: 'Edition or PDF not found' }, { status: 404 });
    }

    const pdfPath = resolvePublicPath(edition[0].pdf_url.replace(/^\//, ''));
    const pdfBuffer = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    const uploadsDir = getUploadsDir();
    await mkdir(uploadsDir, { recursive: true });

    // Clear existing pages for this edition
    await db.delete(edition_pages).where(eq(edition_pages.edition_id, editionId));

    // Return metadata for client-side processing
    return NextResponse.json({
      success: true,
      requiresClientSide: true,
      message: `PDF has ${pageCount} pages. Use client-side extraction.`,
      data: {
        pageCount,
        editionId,
        pdfUrl: edition[0].pdf_url,
        extractionMethod: 'client-side'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to read PDF metadata',
      details: error.message,
      requiresClientSide: true
    }, { status: 500 });
  }
}