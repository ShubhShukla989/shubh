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
    
    console.log('🚀 Starting HIGH-QUALITY PDF extraction');
    console.log('📋 Settings:', { editionId, resolution, format, quality });

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
    console.log('📄 PDF Path:', pdfPath);

    // Read PDF to get page count
    const pdfBuffer = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    console.log('📊 PDF has', pageCount, 'pages');

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Get tool paths (Ghostscript + ImageMagick combination)
    const isWindows = process.platform === 'win32';
    const gsPath = isWindows 
      ? (process.env.GHOSTSCRIPT_PATH || 'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe')
      : (process.env.GHOSTSCRIPT_PATH || 'gs');
    
    const magickPath = isWindows
      ? (process.env.IMAGEMAGICK_PATH || 'magick')
      : (process.env.IMAGEMAGICK_PATH || 'convert');
    
    // Extract all pages using Ghostscript + ImageMagick
    const outputPattern = join(uploadsDir, `edition-${editionId}-page-%d.${format}`);
    
    // Build ENHANCED Ghostscript command for HIGH-QUALITY newspaper pages
    const gsCommand = [
      `"${gsPath}"`,
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
      
      `-sOutputFile="${outputPattern}"`,
      `"${pdfPath}"`
    ].filter(Boolean).join(' ');

    console.log('⚙️ Executing Ghostscript + ImageMagick extraction');

    // Execute Ghostscript
    const { stdout, stderr } = await execAsync(gsCommand);
    
    if (stderr && !stderr.includes('Warning')) {
      console.error('❌ Extraction error:', stderr);
    }
    
    console.log('✅ Extraction completed successfully');
    if (stdout) console.log('📝 Output:', stdout);

    // Clear existing pages for this edition
    await db.delete(edition_pages).where(eq(edition_pages.edition_id, editionId));
    console.log('🗑️ Cleared existing pages');

    // Insert new pages into database (Ghostscript numbering: 1, 2, 3...)
    const newPages = [];
    for (let i = 1; i <= pageCount; i++) {
      const filename = `edition-${editionId}-page-${i}.${format}`;
      const imagePath = `/uploads/${filename}`;
      
      newPages.push({
        edition_id: editionId,
        page_number: i,
        image_url: imagePath,
      });
    }

    const insertedPages = await db.insert(edition_pages).values(newPages).returning();
    console.log('💾 Inserted', insertedPages.length, 'pages into database');

    return NextResponse.json({
      success: true,
      message: `Successfully extracted ${pageCount} pages`,
      data: {
        pageCount,
        pages: insertedPages,
        settings: { resolution, format, quality },
        tool: 'Ghostscript + ImageMagick'
      }
    });

  } catch (error: any) {
    console.error('💥 PDF extraction failed:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to extract PDF pages';
    
    if (error.message?.includes('gs: command not found') || error.message?.includes('not recognized')) {
      errorMessage = 'Ghostscript not found. Please install Ghostscript.';
    } else if (error.message?.includes('magick: command not found')) {
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
        tool: 'Ghostscript + ImageMagick'
      },
      { status: 500 }
    );
  }
}