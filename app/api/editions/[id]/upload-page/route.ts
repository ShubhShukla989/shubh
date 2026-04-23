import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { editions, edition_pages, epaper_categories } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getUploadsDir } from '@/lib/paths';
import { invalidateCompleteEditionCache } from '@/lib/services/editionService';
import { deleteCachePattern } from '@/lib/cache/redis';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/editions/[id]/upload-page
 * Upload extracted page from client-side PDF extraction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pageNumber = parseInt(formData.get('pageNumber') as string);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory
    const uploadsDir = getUploadsDir();
    await mkdir(uploadsDir, { recursive: true });

    // Detect actual file extension from mime type
    const mimeType = file.type || 'image/jpeg';
    const ext = mimeType.includes('png') ? 'png' : 'jpg';

    // Generate filename using actual extension
    const fileName = `edition-${editionId}-page-${pageNumber}.${ext}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Generate public URL
    const imageUrl = `/uploads/${fileName}`;

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

    // Invalidate caches so new thumbnail shows immediately everywhere
    await Promise.all([
      invalidateCompleteEditionCache(editionId),
      deleteCachePattern('editions:featured:*'),
      deleteCachePattern('editions:latest-by-categories:*'),
      deleteCachePattern('epaper:editions-by-category:*'),
    ]);

    // 🚀 AUTO-CLEAR Next.js cache after page upload
    try {
      const [edition] = await db.select().from(editions).where(eq(editions.id, editionId)).limit(1);
      
      if (edition?.status === 'published') {
        revalidatePath('/', 'page');
        revalidatePath('/epaper/display', 'page');
        revalidatePath(`/epaper/view/${editionId}`, 'page');
        
        if (edition.category_id) {
          const [cat] = await db.select({ alias: epaper_categories.alias })
            .from(epaper_categories)
            .where(eq(epaper_categories.id, edition.category_id))
            .limit(1);
          
          if (cat?.alias) {
            revalidatePath(`/epaper/category/${cat.alias}`, 'page');
          }
        }
        
        console.log('✅ Cache cleared after page upload');
      }
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }

    return NextResponse.json({
      success: true,
      data: pageData,
    });

  } catch (error) {
    console.error('Upload page error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload page: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}
