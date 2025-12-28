import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Disable Next.js caching for area maps
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      const updatedAreas = [];
      
      // Process each area map from the request
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
          // UPDATE existing area (preserve ID)
          console.log('🔄 Updating existing area:', area.id, cleanArea);
          const [updated] = await db
            .update(area_maps)
            .set(cleanArea)
            .where(eq(area_maps.id, area.id))
            .returning();
          
          if (updated) {
            updatedAreas.push({
              ...updated,
              linked_area_ids: updated.linked_area_ids 
                ? JSON.parse(updated.linked_area_ids) 
                : []
            });
          }
        } else {
          // INSERT new area (will get new ID)
          console.log('➕ Inserting new area:', cleanArea);
          const [inserted] = await db
            .insert(area_maps)
            .values(cleanArea)
            .returning();
          
          if (inserted) {
            updatedAreas.push({
              ...inserted,
              linked_area_ids: inserted.linked_area_ids 
                ? JSON.parse(inserted.linked_area_ids) 
                : []
            });
          }
        }
      }
      
      // DELETE areas that were removed (exist in DB but not in request)
      const requestIds = areaMaps.filter((area: any) => area.id).map((area: any) => area.id);
      const areasToDelete = existingIds.filter(id => !requestIds.includes(id));
      
      if (areasToDelete.length > 0) {
        console.log('🗑️ Deleting removed areas:', areasToDelete);
        for (const idToDelete of areasToDelete) {
          await db
            .delete(area_maps)
            .where(eq(area_maps.id, idToDelete));
        }
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
            
            try {
              // Get the linked area's current linked_area_ids from the fresh data
              const linkedArea = allAreaMapsAfterSave.find(a => a.id === linkedAreaId);

              if (linkedArea) {
                console.log(`  ✅ Found linked Area ${linkedAreaId}:`, {
                  id: linkedArea.id,
                  title: linkedArea.title,
                  current_links: linkedArea.linked_area_ids
                });
                
                const linkedAreaIds = linkedArea.linked_area_ids 
                  ? JSON.parse(linkedArea.linked_area_ids).map((id: any) => Number(id))
                  : [];

                console.log(`  📋 Current links for Area ${linkedAreaId}:`, linkedAreaIds);
                
                // Add current area to linked area's list (if not already there)
                if (!linkedAreaIds.includes(savedArea.id)) {
                  const updatedLinkedAreaIds = [...linkedAreaIds, savedArea.id];
                  
                  console.log(`  ➕ Adding bidirectional link: ${linkedAreaId} → ${savedArea.id}`);
                  console.log(`  📝 New links for Area ${linkedAreaId}:`, updatedLinkedAreaIds);
                  
                  await db
                    .update(area_maps)
                    .set({
                      linked_area_ids: JSON.stringify(updatedLinkedAreaIds),
                      updated_at: new Date().toISOString()
                    })
                    .where(eq(area_maps.id, linkedAreaId));

                  console.log(`  ✅ Successfully added bidirectional link: Area ${linkedAreaId} now links back to Area ${savedArea.id}`);
                } else {
                  console.log(`  ⏭️ Area ${linkedAreaId} already links to Area ${savedArea.id}, skipping`);
                }
              } else {
                console.warn(`  ⚠️ Linked Area ${linkedAreaId} not found in database`);
              }
            } catch (error) {
              console.error(`  ❌ Failed to add bidirectional link for area ${linkedAreaId}:`, error);
            }
          }
        } else {
          console.log(`  ⏭️ Area ${savedArea.id} has no links, skipping`);
        }
      }
      
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
