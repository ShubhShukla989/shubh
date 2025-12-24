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
    console.log('[GET /api/editions/[id]/pages] Edition ID:', editionId);

    // Get query parameters - DEFAULT to true for watermark
    const removeLogo = request.nextUrl.searchParams.get('remove_logo') !== 'false';
    const applyWatermark = request.nextUrl.searchParams.get('apply_watermark') !== 'false';

    console.log('[GET /api/editions/[id]/pages] 🔧 Parameters - removeLogo:', removeLogo, 'applyWatermark:', applyWatermark);

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

    console.log('[GET /api/editions/[id]/pages] Pages count:', pages.length);

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
          // Calculate file size for file-based images
          const fs = require('fs');
          const path = require('path');
          
          let filePath = page.image_url;
          if (filePath.startsWith('/uploads/')) {
            filePath = path.join(process.cwd(), 'public', filePath);
          }
          
          if (fs.existsSync(filePath)) {
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
            page.file_size = 'Unknown';
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
        console.error(`[GET /api/editions/[id]/pages] Error calculating file size for page ${page.page_number}:`, error);
        page.file_size = 'Error';
      }
    }

    // Process images if requested
    if ((removeLogo || applyWatermark) && pages.length > 0) {
      console.log('[GET /api/editions/[id]/pages] Processing images - removeLogo:', removeLogo, 'applyWatermark:', applyWatermark);
      
      // Fetch watermark settings if needed
      let watermarkSettings: WatermarkSettings | null = null;
      
      if (applyWatermark) {
        console.log('[GET /api/editions/[id]/pages] Fetching watermark settings for edition category:', edition.category_id);
        
        // Try category-specific settings first
        if (edition.category_id) {
          const [categorySettings] = await db
            .select()
            .from(category_watermark_settings)
            .where(eq(category_watermark_settings.category_id, edition.category_id))
            .limit(1);

          console.log('[GET /api/editions/[id]/pages] Category settings found:', !!categorySettings);
          console.log('[GET /api/editions/[id]/pages] Category override enabled:', categorySettings?.override_global_settings);

          // Use category settings if override is enabled
          if (categorySettings && categorySettings.override_global_settings) {
            watermarkSettings = categorySettings as WatermarkSettings;
            console.log(`[GET /api/editions/[id]/pages] ✅ Using category watermark settings for category ${edition.category_id}`);
            console.log('[GET /api/editions/[id]/pages] Category watermark enabled:', watermarkSettings.enable_watermarking);
          }
        }

        // Fallback to global settings if no category override
        if (!watermarkSettings) {
          const [globalSettings] = await db
            .select()
            .from(area_map_watermark_settings)
            .where(eq(area_map_watermark_settings.id, 1))
            .limit(1);
          
          watermarkSettings = globalSettings as WatermarkSettings;
          console.log('[GET /api/editions/[id]/pages] ✅ Using global watermark settings');
          console.log('[GET /api/editions/[id]/pages] Global settings found:', !!globalSettings);
          console.log('[GET /api/editions/[id]/pages] Global watermark enabled:', globalSettings?.enable_watermarking);
        }

        if (!watermarkSettings) {
          console.log('[GET /api/editions/[id]/pages] ❌ No watermark settings found');
        } else {
          console.log('[GET /api/editions/[id]/pages] 📋 Watermark settings:', {
            enable_watermarking: watermarkSettings.enable_watermarking,
            logo_url: watermarkSettings.logo_url,
            info_text: watermarkSettings.info_text,
            position: watermarkSettings.position,
            opacity: watermarkSettings.opacity
          });
        }
      }

      // Process each page
      for (const page of pages) {
        let processedImage = page.image_url;
        
        // Convert file path to base64 if needed
        if (page.image_url && !page.image_url.startsWith('data:image')) {
          try {
            console.log(`[GET /api/editions/[id]/pages] 📁 Converting file to base64: ${page.image_url}`);
            
            // Read file from disk
            const fs = require('fs');
            const path = require('path');
            
            // Convert relative URL to absolute file path
            let filePath = page.image_url;
            if (filePath.startsWith('/uploads/')) {
              filePath = path.join(process.cwd(), 'public', filePath);
            }
            
            // Check if file exists
            if (fs.existsSync(filePath)) {
              const imageBuffer = fs.readFileSync(filePath);
              const base64 = imageBuffer.toString('base64');
              processedImage = `data:image/png;base64,${base64}`;
              console.log(`[GET /api/editions/[id]/pages] ✅ File converted to base64 for page ${page.page_number}`);
            } else {
              console.log(`[GET /api/editions/[id]/pages] ❌ File not found: ${filePath}`);
              continue;
            }
          } catch (error) {
            console.error(`[GET /api/editions/[id]/pages] ❌ Error converting file to base64 for page ${page.page_number}:`, error);
            continue;
          }
        }

        if (processedImage && processedImage.startsWith('data:image')) {
          try {
            console.log(`[GET /api/editions/[id]/pages] 🖼️ Processing page ${page.page_number}`);

            // Step 1: Remove DBD logo if requested
            if (removeLogo) {
              console.log(`[GET /api/editions/[id]/pages] 🗑️ Removing DBD logo from page ${page.page_number}`);
              processedImage = await removeDBDLogoFromBase64(processedImage);
              console.log(`[GET /api/editions/[id]/pages] ✅ DBD logo removed from page ${page.page_number}`);
            }

            // Step 2: Apply watermark if requested and settings available
            if (applyWatermark && watermarkSettings && watermarkSettings.enable_watermarking) {
              console.log(`[GET /api/editions/[id]/pages] 🎨 Applying watermark to page ${page.page_number}`);
              
              // Create watermark context
              const context: WatermarkContext = {
                edition_title: edition.title || '',
                date: edition.date || new Date().toISOString().split('T')[0],
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/epaper/view/${editionId}?page=${page.page_number}`
              };

              console.log(`[GET /api/editions/[id]/pages] 📋 Watermark context:`, context);

              // Apply watermark (without removing logo again since we already did it)
              processedImage = await applyWatermarkToBase64(
                processedImage,
                watermarkSettings,
                context,
                false // Don't remove logo again
              );
              
              console.log(`[GET /api/editions/[id]/pages] ✅ Watermark applied to page ${page.page_number}`);
            } else if (applyWatermark) {
              console.log(`[GET /api/editions/[id]/pages] ⚠️ Skipping watermark for page ${page.page_number} - watermarking disabled or no settings`);
            }

            page.image_url = processedImage;
          } catch (error) {
            console.error(`[GET /api/editions/[id]/pages] ❌ Error processing page ${page.page_number}:`, error);
          }
        } else {
          console.log(`[GET /api/editions/[id]/pages] ⚠️ Skipping page ${page.page_number} - no valid image data`);
        }
      }
    }

    console.log('[GET /api/editions/[id]/pages] Returning', pages.length, 'pages');
    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    console.error('[GET /api/editions/[id]/pages] Error:', error);
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

    console.log('[PUT /api/editions/[id]/pages] Updating page:', { editionId, pageId, title, alias, description });

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

    console.log('[PUT /api/editions/[id]/pages] Page updated successfully:', updatedPage.id);
    return NextResponse.json({ 
      success: true, 
      data: updatedPage,
      message: 'Page updated successfully' 
    });
  } catch (error) {
    console.error('[PUT /api/editions/[id]/pages] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}
