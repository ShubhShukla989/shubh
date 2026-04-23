import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps, edition_pages } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateCompleteEditionCache } from '@/lib/services/editionService';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Disable Next.js caching for area maps
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Generate cropped image for area map
 */
async function generateCroppedImage(areaMapId: number, areaMap: any, pageId: number) {
  try {
    // Fetch page data
    const [page] = await db
      .select()
      .from(edition_pages)
      .where(eq(edition_pages.id, pageId))
      .limit(1);

    if (!page) {
      console.warn(`Page ${pageId} not found for area map ${areaMapId}`);
      return;
    }

    const publicPath = path.join(process.cwd(), 'public');
    const croppedDir = path.join(publicPath, 'uploads', 'area-maps', 'cropped');
    
    // Create directory if it doesn't exist
    await fs.mkdir(croppedDir, { recursive: true });

    const croppedFilename = `area-${areaMapId}.png`;
    const croppedPath = path.join(croppedDir, croppedFilename);

    // Load page image
    const imagePath = page.image_url.startsWith('/') 
      ? path.join(publicPath, page.image_url)
      : path.join(publicPath, '/', page.image_url);

    const imageBuffer = await fs.readFile(imagePath);

    // Crop the area
    await sharp(imageBuffer)
      .extract({
        left: Math.round(areaMap.x),
        top: Math.round(areaMap.y),
        width: Math.round(areaMap.width),
        height: Math.round(areaMap.height)
      })
      .png()
      .toFile(croppedPath);

    console.log(`✅ Generated cropped image for area map ${areaMapId}`);
  } catch (error) {
    console.error(`❌ Failed to generate cropped image for area map ${areaMapId}:`, error);
    // Don't throw - continue even if cropping fails
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const data = await db
      .select()
      .from(area_maps)
      .where(eq(area_maps.page_id, parseInt(params.pageId)));

    // Parse linked_area_ids from JSON string to array of numbers
    const parsedData = data.map(area => ({
      ...area,
      id: Number(area.id), // Ensure ID is number
      linked_area_ids: area.linked_area_ids 
        ? JSON.parse(area.linked_area_ids).map((id: any) => Number(id))
        : []
    }));

    return NextResponse.json({ success: true, data: parsedData }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Get area maps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch area maps' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const body = await request.json();
    
    // Check if this is a bulk save (has areaMaps array) or single area map
    if (body.areaMaps && Array.isArray(body.areaMaps)) {
      // Bulk save - intelligently update/insert/delete area maps for this page
      const areaMaps = body.areaMaps;
      
      // Get existing area maps for this page
      const existingAreas = await db
        .select()
        .from(area_maps)
        .where(eq(area_maps.page_id, parseInt(params.pageId)));
      
      const existingIds = existingAreas.map(area => area.id);
      const updatedAreas: Array<any> = [];

      // Separate areas into inserts and updates
      const toInsert: Array<any> = [];
      const toUpdate: Array<{ id: number; cleanArea: any }> = [];

      for (const area of areaMaps) {
        const cleanArea = {
          x: Number(area.x),
          y: Number(area.y),
          width: Number(area.width),
          height: Number(area.height),
          title: area.title || null,
          url: area.url || null,
          linked_area_ids: Array.isArray(area.linked_area_ids)
            ? JSON.stringify(area.linked_area_ids)
            : (area.linked_area_ids && area.linked_area_ids !== '[]') ? area.linked_area_ids : '[]',
          linked_page_number: area.linked_page_number ? Number(area.linked_page_number) : null,
          page_id: parseInt(params.pageId),
          edition_id: parseInt(params.id),
          updated_at: new Date().toISOString()
        };

        if (area.id && existingIds.includes(area.id)) {
          console.log('🔄 Updating existing area:', area.id, cleanArea);
          toUpdate.push({ id: area.id, cleanArea });
        } else {
          console.log('➕ Inserting new area:', cleanArea);
          toInsert.push(cleanArea);
        }
      }

      // Batch INSERT all new areas in one query
      if (toInsert.length > 0) {
        const inserted = await db
          .insert(area_maps)
          .values(toInsert)
          .returning();

        for (const ins of inserted) {
          updatedAreas.push({
            ...ins,
            linked_area_ids: ins.linked_area_ids ? JSON.parse(ins.linked_area_ids) : []
          });
          generateCroppedImage(ins.id, ins, parseInt(params.pageId)).catch(err =>
            console.error(`Failed to generate cropped image for area ${ins.id}:`, err)
          );
        }
      }

      // Run all UPDATEs in parallel
      if (toUpdate.length > 0) {
        const updateResults = await Promise.all(
          toUpdate.map(({ id, cleanArea }) =>
            db.update(area_maps).set(cleanArea).where(eq(area_maps.id, id)).returning()
          )
        );

        for (const [updated] of updateResults) {
          if (updated) {
            updatedAreas.push({
              ...updated,
              linked_area_ids: updated.linked_area_ids ? JSON.parse(updated.linked_area_ids) : []
            });
            generateCroppedImage(updated.id, updated, parseInt(params.pageId)).catch(err =>
              console.error(`Failed to generate cropped image for area ${updated.id}:`, err)
            );
          }
        }
      }
      
      // DELETE areas that were removed (exist in DB but not in request)
      const requestIds = areaMaps.filter((area: any) => area.id).map((area: any) => area.id);
      const areasToDelete = existingIds.filter(id => !requestIds.includes(id));
      
      if (areasToDelete.length > 0) {
        console.log('🗑️ Deleting removed areas:', areasToDelete);

        // Single batched delete
        await db.delete(area_maps).where(inArray(area_maps.id, areasToDelete));

        // Delete cropped image files in parallel
        await Promise.all(
          areasToDelete.map(async (idToDelete) => {
            try {
              const publicPath = path.join(process.cwd(), 'public');
              const croppedPath = path.join(publicPath, 'uploads', 'area-maps', 'cropped', `area-${idToDelete}.png`);
              await fs.unlink(croppedPath);
              console.log(`🗑️ Deleted cropped image for area ${idToDelete}`);
            } catch (err) {
              console.log(`⏭️ Cropped image for area ${idToDelete} not found, skipping`);
            }
          })
        );
      }
      
      // **BIDIRECTIONAL LINKING FOR BULK SAVE**
      // After all areas are saved, process bidirectional linking
      console.log('🔗 ========== BIDIRECTIONAL LINKING START ==========');
      console.log('🔗 Processing bidirectional linking for bulk save...');
      console.log('🔗 Total areas to process:', updatedAreas.length);
      
      // First, fetch ALL area maps again to get the latest state after updates
      const allAreaMapsAfterSave = await db
        .select()
        .from(area_maps)
        .where(eq(area_maps.edition_id, parseInt(params.id)));
      
      console.log('📊 Total area maps in edition after save:', allAreaMapsAfterSave.length);
      
      // Build a Map<linkedAreaId, Set<areaIds that link to it>> for all bidirectional updates
      const reverseLinks = new Map<number, Set<number>>();

      for (const savedArea of updatedAreas) {
        console.log(`🔍 Checking Area ${savedArea.id}:`, {
          id: savedArea.id,
          title: savedArea.title,
          linked_area_ids: savedArea.linked_area_ids
        });

        if (savedArea.linked_area_ids && savedArea.linked_area_ids.length > 0) {
          console.log(`🔗 Area ${savedArea.id} has ${savedArea.linked_area_ids.length} links:`, savedArea.linked_area_ids);

          for (const linkedAreaId of savedArea.linked_area_ids) {
            console.log(`  ➡️ Processing link to Area ${linkedAreaId}...`);
            if (!reverseLinks.has(linkedAreaId)) {
              reverseLinks.set(linkedAreaId, new Set());
            }
            reverseLinks.get(linkedAreaId)!.add(savedArea.id);
          }
        } else {
          console.log(`  ⏭️ Area ${savedArea.id} has no links, skipping`);
        }
      }

      // Run all bidirectional updates in parallel
      await Promise.all(
        Array.from(reverseLinks.entries()).map(async ([linkedAreaId, sourceIds]) => {
          try {
            const linkedArea = allAreaMapsAfterSave.find(a => a.id === linkedAreaId);

            if (linkedArea) {
              console.log(`  ✅ Found linked Area ${linkedAreaId}:`, {
                id: linkedArea.id,
                title: linkedArea.title,
                current_links: linkedArea.linked_area_ids
              });

              const existingLinkedIds = linkedArea.linked_area_ids
                ? JSON.parse(linkedArea.linked_area_ids).map((id: any) => Number(id))
                : [];

              console.log(`  📋 Current links for Area ${linkedAreaId}:`, existingLinkedIds);

              const newIds = Array.from(sourceIds).filter(id => !existingLinkedIds.includes(id));
              if (newIds.length > 0) {
                const updatedLinkedAreaIds = [...existingLinkedIds, ...newIds];
                console.log(`  ➕ Adding bidirectional links: ${linkedAreaId} → ${newIds.join(', ')}`);
                console.log(`  📝 New links for Area ${linkedAreaId}:`, updatedLinkedAreaIds);

                await db
                  .update(area_maps)
                  .set({
                    linked_area_ids: JSON.stringify(updatedLinkedAreaIds),
                    updated_at: new Date().toISOString()
                  })
                  .where(eq(area_maps.id, linkedAreaId));

                console.log(`  ✅ Successfully added bidirectional links for Area ${linkedAreaId}`);
              } else {
                console.log(`  ⏭️ Area ${linkedAreaId} already has all back-links, skipping`);
              }
            } else {
              console.warn(`  ⚠️ Linked Area ${linkedAreaId} not found in database`);
            }
          } catch (error) {
            console.error(`  ❌ Failed to add bidirectional link for area ${linkedAreaId}:`, error);
          }
        })
      );
      
      // Fetch the final state after bidirectional linking
      const finalAreaMaps = await db
        .select()
        .from(area_maps)
        .where(eq(area_maps.page_id, parseInt(params.pageId)));
      
      const finalParsedData = finalAreaMaps.map(area => ({
        ...area,
        id: Number(area.id),
        linked_area_ids: area.linked_area_ids 
          ? JSON.parse(area.linked_area_ids).map((id: any) => Number(id))
          : []
      }));
      
      console.log('🔗 ========== BIDIRECTIONAL LINKING END ==========');
      console.log('✅ Bulk save completed:', finalParsedData.length, 'areas processed');
      console.log('📊 Final area maps with bidirectional links:', finalParsedData);
      
      // Revalidate edition view page cache after area maps are updated
      try {
        revalidatePath(`/epaper/view/${params.id}`, 'page');
        await invalidateCompleteEditionCache(parseInt(params.id));
        console.log(`✅ Cache revalidated for edition ${params.id} after area map update`);
      } catch (e) {
        console.error('❌ Failed to revalidate cache:', e);
      }
      
      return NextResponse.json({ success: true, data: finalParsedData }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      // Single area map creation
      // Validate required fields
      const requiredFields = ['x', 'y', 'width', 'height'];
      const missingFields = requiredFields.filter(field => 
        body[field] === undefined || body[field] === null
      );
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required fields: ${missingFields.join(', ')}`,
            received: body
          },
          { status: 400 }
        );
      }

      // Validate field types
      const numericFields = ['x', 'y', 'width', 'height'];
      const invalidFields = numericFields.filter(field => 
        typeof body[field] !== 'number' || isNaN(body[field])
      );
      
      if (invalidFields.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid numeric values for fields: ${invalidFields.join(', ')}`,
            received: body
          },
          { status: 400 }
        );
      }

      const cleanData = {
        x: Number(body.x),
        y: Number(body.y),
        width: Number(body.width),
        height: Number(body.height),
        title: body.title || null,
        url: body.url || null,
        linked_area_ids: Array.isArray(body.linked_area_ids) 
          ? JSON.stringify(body.linked_area_ids) 
          : (body.linked_area_ids && body.linked_area_ids !== '[]') ? body.linked_area_ids : '[]',
        linked_page_number: body.linked_page_number ? Number(body.linked_page_number) : null,
        page_id: parseInt(params.pageId),
        edition_id: parseInt(params.id),
      };
      
      console.log('Inserting single area map:', cleanData);
      
      const [newAreaMap] = await db
        .insert(area_maps)
        .values(cleanData)
        .returning();

      // Generate cropped image for new area map
      if (newAreaMap) {
        generateCroppedImage(newAreaMap.id, cleanData, parseInt(params.pageId)).catch(err => 
          console.error(`Failed to generate cropped image for area ${newAreaMap.id}:`, err)
        );
      }

      // Revalidate edition view page cache after area map is created
      try {
        revalidatePath(`/epaper/view/${params.id}`, 'page');
        await invalidateCompleteEditionCache(parseInt(params.id));
        console.log(`✅ Cache revalidated for edition ${params.id} after area map creation`);
      } catch (e) {
        console.error('❌ Failed to revalidate cache:', e);
      }

      return NextResponse.json({ success: true, data: newAreaMap }, { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  } catch (error) {
    console.error('Create area map error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create area map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
