import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/editions/:id/extract-pages
 * 
 * Extracts pages from PDF using Railway PDF Extraction Service
 * 
 * This uses a separate microservice deployed on Railway that has ImageMagick installed.
 * The service converts PDF pages to high-quality PNG images.
 */

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== PDF EXTRACTION STARTED ===');
  try {
    const { id } = params;
    console.log('Edition ID:', id);
    
    const body = await request.json();
    const { 
      startPage = 1, 
      endPage = 1, 
      extractAll = true,
      resolution = 150 // DPI for image quality
    } = body;
    console.log('Extraction settings:', { startPage, endPage, extractAll, resolution });

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get edition with PDF URL
    const { data: edition, error: editionError } = await supabaseAdmin
      .from('editions')
      .select('*')
      .eq('id', id)
      .single();

    if (editionError || !edition) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    if (!edition.pdf_url) {
      return NextResponse.json(
        { success: false, error: 'No PDF uploaded for this edition' },
        { status: 400 }
      );
    }

    // Download PDF from URL with timeout
    console.log('Downloading PDF from:', edition.pdf_url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let pdfDoc;
    let totalPages;
    
    try {
      const pdfResponse = await fetch(edition.pdf_url, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!pdfResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to download PDF' },
          { status: 500 }
        );
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      console.log('PDF downloaded, size:', pdfBuffer.byteLength);

      // Load PDF with pdf-lib
      console.log('Loading PDF document...');
      pdfDoc = await PDFDocument.load(pdfBuffer);
      totalPages = pdfDoc.getPageCount();
      console.log('PDF loaded successfully, total pages:', totalPages);
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error('PDF download error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to download or load PDF: ' + (fetchError instanceof Error ? fetchError.message : 'Unknown error') },
        { status: 500 }
      );
    }
    
    // Delete existing pages for this edition to allow re-extraction
    console.log('Deleting existing pages for edition:', id);
    const { error: deleteError } = await supabaseAdmin
      .from('edition_pages')
      .delete()
      .eq('edition_id', id);
    
    if (deleteError) {
      console.error('Failed to delete existing pages:', deleteError);
      // Continue anyway - might be first extraction
    } else {
      console.log('Existing pages deleted successfully');
    }
    
    const pagesToExtract = extractAll ? totalPages : Math.min(endPage, totalPages) - startPage + 1;
    const maxPages = Math.min(pagesToExtract, 30); // Limit to 30 pages

    const extractedPages = [];

    // Get PDF buffer for sending to extraction service
    const pdfBufferData = await pdfDoc.save();
    console.log('PDF buffer prepared, size:', pdfBufferData.byteLength);

    // Call Railway PDF Extraction Service
    const PDF_SERVICE_URL = process.env.PDF_EXTRACTION_SERVICE_URL || 'http://localhost:3333';
    console.log('Calling PDF extraction service:', PDF_SERVICE_URL);

    // Create FormData for PDF upload
    const formData = new FormData();
    const pdfBlob = new Blob([pdfBufferData], { type: 'application/pdf' });
    formData.append('pdf', pdfBlob, `edition-${id}.pdf`);
    formData.append('startPage', startPage.toString());
    formData.append('endPage', Math.min(startPage + maxPages - 1, totalPages).toString());
    formData.append('extractAll', extractAll.toString());
    formData.append('resolution', resolution.toString());

    // Call extraction service
    const extractResponse = await fetch(`${PDF_SERVICE_URL}/extract-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('PDF extraction service error:', errorText);
      return NextResponse.json(
        { success: false, error: 'PDF extraction service failed: ' + errorText },
        { status: 500 }
      );
    }

    const extractResult = await extractResponse.json();
    console.log(`Extraction service returned ${extractResult.pages?.length || 0} pages`);

    // Process each extracted page
    for (const page of extractResult.pages || []) {
      try {
        const { pageNumber, imageData } = page;
        console.log(`Processing extracted page ${pageNumber}...`);

        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        console.log(`Page ${pageNumber} image size: ${imageBuffer.byteLength} bytes`);

        // Upload PNG image to storage
        const fileName = `edition-${id}-page-${pageNumber}.png`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('page-assets')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Failed to upload page ${pageNumber}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('page-assets')
          .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        // Create page record with image URL
        console.log(`Inserting page ${pageNumber} into database...`);
        const { data: pageData, error: pageError } = await supabaseAdmin
          .from('edition_pages')
          .insert({
            edition_id: parseInt(id),
            page_number: pageNumber,
            image_url: imageUrl,
          })
          .select()
          .single();

        if (pageError) {
          console.error(`Failed to insert page ${pageNumber} into database:`, pageError);
          continue;
        }

        if (pageData) {
          console.log(`Page ${pageNumber} inserted successfully, ID: ${pageData.id}`);
          extractedPages.push(pageData);
        }

        console.log(`Page ${pageNumber} processed successfully`);
      } catch (pageError) {
        console.error(`Error processing page:`, pageError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPages,
        extractedPages: extractedPages.length,
        pages: extractedPages,
      },
    });

  } catch (error) {
    console.error('Extract pages error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Detailed error:', {
      message: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to extract pages: ' + errorMessage,
        details: errorStack?.split('\n').slice(0, 3).join('\n'),
      },
      { status: 500 }
    );
  }
}
