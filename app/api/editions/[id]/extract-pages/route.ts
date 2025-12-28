import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { db } from '@/lib/db';
import { editions, edition_pages } from '@/lib/schema/index';
import { eq } from 'drizzle-orm';

/**
 * Ghostscript + ImageMagick PDF Page Extraction
 * 
 * Uses the most reliable combination:
 * - Ghostscript: PDF to PostScript conversion
 * - ImageMagick: PostScript to high-quality images
 * - pdf-lib: PDF metadata reading
 * 
 * Requirements:
 * - Ghostscript: Already installed at C:\Program Files\gs\gs10.03.1\bin\gswin64c.exe
 * - ImageMagick: Need to install for image processing
 * 
 * Usage: POST /api/editions/[id]/extract-pages
 * Body: { resolution?: number, format?: 'png' | 'jpg', quality?: number }
 */

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const body = await request.json();
    
    // ENHANCED Extract settings for HIGH-QUALITY newspaper pages
    const resolution = Math.min(body.resolution || 200, 300); // Increased to 300 DPI max for better quality
    const format = body.format || 'jpg'; // Use JPEG for smaller files
    const quality = body.quality || 88; // ENHANCED quality for newspapers (was 75)

    // Get edition details
    const edition = await db
      .select()
      .from(editions)
      .where(eq(editions.id, editionId))
      .limit(1);

    if (!edition.length || !edition[0].pdf_url) {
      return NextResponse.json(
        { success: false, error: 'Edition or PDF not found' },
        { status: 404 }
      );
    }

    const pdfPath = join(process.cwd(), 'public', edition[0].pdf_url);

    // Read PDF to get page count
    const pdfBuffer = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Get tool paths (pdftoppm + ImageMagick v6 combination for Ubuntu VPS)
    const isWindows = process.platform === 'win32';
    const isUbuntu = process.platform === 'linux';
    
    // Use pdftoppm for Ubuntu VPS (more reliable than Ghostscript)
    const pdfTool = isUbuntu ? 'pdftoppm' : (isWindows 
      ? (process.env.GHOSTSCRIPT_PATH || 'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe')
      : (process.env.GHOSTSCRIPT_PATH || 'gs'));
    
    // Use ImageMagick v6 'convert' for Ubuntu VPS
    const magickPath = isUbuntu ? 'convert' : (isWindows
      ? (process.env.IMAGEMAGICK_PATH || 'magick')
      : (process.env.IMAGEMAGICK_PATH || 'convert'));
    
    // Extract all pages using pdftoppm (Ubuntu) or Ghostscript (Windows/Mac)
    const outputPattern = join(uploadsDir, `edition-${editionId}-page`);
    
    let extractCommand: string;
    
    if (isUbuntu) {
      // Ubuntu VPS: Use pdftoppm (more reliable)
      extractCommand = [
        'pdftoppm',
        '-jpeg',
        `-r ${resolution}`,
        `-jpegopt quality=${quality}`,
        `"${pdfPath}"`,
        `"${outputPattern}"`
      ].join(' ');
    } else {
      // Windows/Mac: Use Ghostscript
      extractCommand = [
        `"${pdfTool}"`,
        '-dNOPAUSE',
        '-dBATCH',
        '-dSAFER',
        '-sDEVICE=' + (format === 'png' ? 'png16m' : 'jpeg'),
        `-r${resolution}`,
        
        // ENHANCED JPEG optimization for newspapers
        format === 'jpg' ? `-dJPEGQ=${quality}` : '',
        format === 'jpg' ? '-dColorConversionStrategy=/LeaveColorUnchanged' : '',
        format === 'jpg' ? '-dEncodeColorImages=true' : '',
        format === 'jpg' ? '-dEncodeGrayImages=true' : '',
        format === 'jpg' ? '-dOptimize=true' : '', // Enable optimization
        format === 'jpg' ? '-dDownsampleColorImages=false' : '', // Don't downsample for quality
        format === 'jpg' ? '-dDownsampleGrayImages=false' : '', // Don't downsample for quality
        
        // ENHANCED PNG optimization
        format === 'png' ? '-dTextAlphaBits=4' : '',
        format === 'png' ? '-dGraphicsAlphaBits=4' : '',
        
        // ENHANCED General optimizations for newspapers
        '-dUseCropBox',
        '-dPDFFitPage',
        '-dAutoRotatePages=/None',
        '-dPrinted=false', // Better quality for screen viewing
        '-dMaxBitmap=500000000', // Allow larger bitmaps for quality
        
        `-sOutputFile="${join(uploadsDir, `edition-${editionId}-page-%d.${format}`)}"`,
        `"${pdfPath}"`
      ].filter(Boolean).join(' ');
    }

    // Execute extraction command
    const { stdout, stderr } = await execAsync(extractCommand);
    
    if (stderr && !stderr.includes('Warning')) {
      // Handle extraction errors silently in production
    }

    // Clear existing pages for this edition
    await db.delete(edition_pages).where(eq(edition_pages.edition_id, editionId));

    // Insert new pages into database
    const newPages = [];
    
    if (isUbuntu) {
      // pdftoppm creates files like: edition-1-page-01.jpg, edition-1-page-02.jpg, etc.
      for (let i = 1; i <= pageCount; i++) {
        const pageNum = i.toString().padStart(2, '0'); // 01, 02, 03...
        const filename = `edition-${editionId}-page-${pageNum}.jpg`;
        const imagePath = `/uploads/${filename}`;
        
        newPages.push({
          edition_id: editionId,
          page_number: i,
          image_url: imagePath,
        });
      }
    } else {
      // Ghostscript creates files like: edition-1-page-1.jpg, edition-1-page-2.jpg, etc.
      for (let i = 1; i <= pageCount; i++) {
        const filename = `edition-${editionId}-page-${i}.${format}`;
        const imagePath = `/uploads/${filename}`;
        
        newPages.push({
          edition_id: editionId,
          page_number: i,
          image_url: imagePath,
        });
      }
    }

    const insertedPages = await db.insert(edition_pages).values(newPages).returning();

    return NextResponse.json({
      success: true,
      message: `Successfully extracted ${pageCount} pages`,
      data: {
        pageCount,
        pages: insertedPages,
        settings: { resolution, format, quality },
        tool: isUbuntu ? 'pdftoppm' : 'Ghostscript',
        platform: process.platform
      }
    });

  } catch (error: any) {
    // Platform detection for error messages
    const isUbuntu = process.platform === 'linux';
    
    // Provide helpful error messages
    let errorMessage = 'Failed to extract PDF pages';
    
    if (error.message?.includes('pdftoppm: command not found') || error.message?.includes('gs: command not found') || error.message?.includes('not recognized')) {
      errorMessage = isUbuntu ? 'pdftoppm not found. Please install poppler-utils: sudo apt install poppler-utils' : 'Ghostscript not found. Please install Ghostscript.';
    } else if (error.message?.includes('convert: command not found') || error.message?.includes('magick: command not found')) {
      errorMessage = 'ImageMagick not found. Please install ImageMagick.';
    } else if (error.message?.includes('ENOENT')) {
      errorMessage = 'PDF file not found or extraction tools not found.';
    } else if (error.message?.includes('invalidpdf') || error.message?.includes('PDF')) {
      errorMessage = 'Invalid or corrupted PDF file.';
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error.message,
        tool: isUbuntu ? 'pdftoppm' : 'Ghostscript',
        platform: process.platform
      },
      { status: 500 }
    );
  }
}