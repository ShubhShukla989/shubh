import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { edition_pages, area_maps, editions, category_watermark_settings, area_map_watermark_settings } from '@/lib/schema';
import { eq, inArray, asc } from 'drizzle-orm';
import { removeDBDLogoFromBase64 } from '@/lib/remove-logo';
import { applyWatermarkToBase64, WatermarkSettings, WatermarkContext } from '@/lib/watermark';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);

    // Get query parameters - DEFAULT to true for watermark
    const removeLogo = request.nextUrl.searchParams.get('remove_logo') !== 'false';
    const applyWatermark = request.nextUrl.searchParams.get('apply_watermark') !== 'false';

    // Fetch edition details first (needed for watermark context)
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

    // Fetch pages
    const pages = await db
      .select()
      .from(edition_pages)
      .where(eq(edition_pages.edition_id, editionId))
      .orderBy(asc(edition_pages.page_number));

    // Fetch area maps for all pages
    if (pages.length > 0) {
      const pageIds = pages.map(p => p.id);
      
      const areaMapsData = await db
        .select()
        .from(area_maps)
        .where(inArray(area_maps.page_id, pageIds));

      // Group area maps by page_id
      const areaMapsByPage: Record<number, any[]> = {};
      areaMapsData.forEach(am => {
        if (!areaMapsByPage[am.page_id]) {
          areaMapsByPage[am.page_id] = [];
        }
        areaMapsByPage[am.page_id].push(am);
      });

      // Add area_map_config to each page
      pages.forEach((page: any) => {
        const pageMaps = areaMapsByPage[page.id] || [];
        if (pageMaps.length > 0) {
          page.area_map_config = {
            areas: pageMaps.map(am => ({
              coords: `${am.x},${am.y},${Number(am.x) + Number(am.width)},${Number(am.y) + Number(am.height)}`,
              shape: 'rect' as const,
              linkedPageNumber: am.linked_page_number,
              linked_page_number: am.linked_page_number
            }))
          };
        }
      });
    }

    // Add file size information to pages
    for (const page of pages as any[]) {
      try {
        if (page.image_url && !page.image_url.startsWith('data:image')) {
          // Calculate file size for file-based images with FALLBACK LOGIC
          const fs = require('fs');
          const path = require('path');
          
          let filePath = page.image_url;
          let fileExists = false;
          
          // Try original path first
          if (filePath.startsWith('/uploads/')) {
            const originalPath = path.join(process.cwd(), 'public', filePath);
            if (fs.existsSync(originalPath)) {
              filePath = originalPath;
              fileExists = true;
            } else {
              // FALLBACK: Try different path variations for existing files
              const filename = path.basename(filePath);
              
              // Try direct uploads folder
              const directPath = path.join(process.cwd(), 'public', 'uploads', filename);
              if (fs.existsSync(directPath)) {
                filePath = directPath;
                fileExists = true;
                // Update the database with correct path
                page.image_url = `/uploads/${filename}`;
              } else {
                // Try page-assets subfolder
                const pageAssetsPath = path.join(process.cwd(), 'public', 'uploads', 'page-assets', filename);
                if (fs.existsSync(pageAssetsPath)) {
                  filePath = pageAssetsPath;
                  fileExists = true;
                  // Update the database with correct path
                  page.image_url = `/uploads/page-assets/${filename}`;
                }
              }
            }
          }
          
          if (fileExists) {
            const stats = fs.statSync(filePath);
            const fileSizeInBytes = stats.size;
            const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
            const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
            
            if (fileSizeInBytes > 1024 * 1024) {
              page.file_size = `${fileSizeInMB} MB`;
            } else {
              page.file_size = `${fileSizeInKB} KB`;
            }
          } else {
            page.file_size = 'File Not Found';
            page.image_url_error = 'File missing - may need re-extraction';
          }
        } else if (page.image_url && page.image_url.startsWith('data:image')) {
          // Calculate size for base64 images
          const base64Data = page.image_url.split(',')[1];
          const sizeInBytes = (base64Data.length * 3) / 4;
          const sizeInKB = (sizeInBytes / 1024).toFixed(2);
          const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
          
          if (sizeInBytes > 1024 * 1024) {
            page.file_size = `${sizeInMB} MB`;
          } else {
            page.file_size = `${sizeInKB} KB`;
          }
        } else {
          page.file_size = 'Unknown';
        }
      } catch (error) {
        page.file_size = 'Error';
      }
    }

    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);
    const body = await request.json();
    const { pageId, title, alias, description } = body;

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // Update the page
    const [updatedPage] = await db
      .update(edition_pages)
      .set({
        title: title || null,
        alias: alias || null,
        description: description || null,
      })
      .where(eq(edition_pages.id, parseInt(pageId)))
      .returning();

    if (!updatedPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedPage,
      message: 'Page updated successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}
