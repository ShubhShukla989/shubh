import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { area_maps } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; areaId: string } }
) {
  try {
    const body = await request.json();
    console.log('🔄 PUT area-maps: Received data:', body);
    console.log('🆔 PUT area-maps: Area ID:', params.areaId);

    // Validate area ID
    const areaId = parseInt(params.areaId);
    if (isNaN(areaId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid area ID' },
        { status: 400 }
      );
    }

    // Get the current area to compare linked_area_ids changes
    const [currentArea] = await db
      .select()
      .from(area_maps)
      .where(eq(area_maps.id, areaId))
      .limit(1);

    if (!currentArea) {
      console.error('❌ PUT area-maps: Area map not found for ID:', areaId);
      return NextResponse.json(
        { success: false, error: 'Area map not found' },
        { status: 404 }
      );
    }

    // Parse current and new linked IDs
    const currentLinkedIds = currentArea.linked_area_ids 
      ? JSON.parse(currentArea.linked_area_ids).map((id: any) => Number(id))
      : [];
    const newLinkedIds = Array.isArray(body.linked_area_ids) 
      ? body.linked_area_ids.map((id: any) => Number(id))
      : [];

    console.log('🔗 Current linked IDs:', currentLinkedIds);
    console.log('🔗 New linked IDs:', newLinkedIds);

    // Handle linked_area_ids conversion for update
    const updateData = {
      ...body,
      linked_area_ids: JSON.stringify(newLinkedIds),
      updated_at: new Date().toISOString()
    };

    console.log('💾 PUT area-maps: Updating with data:', updateData);

    // Update the main area
    const [updated] = await db
      .update(area_maps)
      .set(updateData)
      .where(eq(area_maps.id, areaId))
      .returning();

    if (!updated) {
      console.error('❌ PUT area-maps: Failed to update area map for ID:', areaId);
      return NextResponse.json(
        { success: false, error: 'Failed to update area map' },
        { status: 500 }
      );
    }

    // **BIDIRECTIONAL LINKING LOGIC**
    
    // Find areas that were added (in new but not in current)
    const addedLinks = newLinkedIds.filter((id: any) => !currentLinkedIds.includes(id));
    
    // Find areas that were removed (in current but not in new)
    const removedLinks = currentLinkedIds.filter((id: any) => !newLinkedIds.includes(id));

    console.log('➕ Added links:', addedLinks);
    console.log('➖ Removed links:', removedLinks);

    // Add bidirectional links for newly linked areas
    for (const linkedAreaId of addedLinks) {
      try {
        // Get the linked area's current linked_area_ids
        const [linkedArea] = await db
          .select()
          .from(area_maps)
          .where(eq(area_maps.id, linkedAreaId))
          .limit(1);

        if (linkedArea) {
          const linkedAreaIds = linkedArea.linked_area_ids 
            ? JSON.parse(linkedArea.linked_area_ids).map((id: any) => Number(id))
            : [];

          // Add current area to linked area's list (if not already there)
          if (!linkedAreaIds.includes(areaId)) {
            const updatedLinkedAreaIds = [...linkedAreaIds, areaId];
            
            await db
              .update(area_maps)
              .set({
                linked_area_ids: JSON.stringify(updatedLinkedAreaIds),
                updated_at: new Date().toISOString()
              })
              .where(eq(area_maps.id, linkedAreaId));

            console.log(`🔗 Added bidirectional link: Area ${linkedAreaId} now links back to Area ${areaId}`);
          }
        }
      } catch (error) {
        console.error(`⚠️ Failed to add bidirectional link for area ${linkedAreaId}:`, error);
      }
    }

    // Remove bidirectional links for unlinked areas
    for (const unlinkedAreaId of removedLinks) {
      try {
        // Get the unlinked area's current linked_area_ids
        const [unlinkedArea] = await db
          .select()
          .from(area_maps)
          .where(eq(area_maps.id, unlinkedAreaId))
          .limit(1);

        if (unlinkedArea) {
          const unlinkedAreaIds = unlinkedArea.linked_area_ids 
            ? JSON.parse(unlinkedArea.linked_area_ids).map((id: any) => Number(id))
            : [];

          // Remove current area from unlinked area's list
          if (unlinkedAreaIds.includes(areaId)) {
            const updatedUnlinkedAreaIds = unlinkedAreaIds.filter((id: any) => id !== areaId);
            
            await db
              .update(area_maps)
              .set({
                linked_area_ids: JSON.stringify(updatedUnlinkedAreaIds),
                updated_at: new Date().toISOString()
              })
              .where(eq(area_maps.id, unlinkedAreaId));

            console.log(`🔗 Removed bidirectional link: Area ${unlinkedAreaId} no longer links back to Area ${areaId}`);
          }
        }
      } catch (error) {
        console.error(`⚠️ Failed to remove bidirectional link for area ${unlinkedAreaId}:`, error);
      }
    }

    // Parse linked_area_ids back to array of numbers for response
    const parsedUpdated = {
      ...updated,
      id: Number(updated.id), // Ensure ID is number
      linked_area_ids: updated.linked_area_ids 
        ? JSON.parse(updated.linked_area_ids).map((id: any) => Number(id))
        : []
    };

    console.log('✅ PUT area-maps: Successfully updated with bidirectional links:', parsedUpdated);
    return NextResponse.json({ success: true, data: parsedUpdated });
  } catch (error) {
    console.error('💥 PUT area-maps error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update area map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; areaId: string } }
) {
  try {
    await db
      .delete(area_maps)
      .where(eq(area_maps.id, parseInt(params.areaId)));

    return NextResponse.json({
      success: true,
      message: 'Area map deleted successfully',
    });
  } catch (error) {
    console.error('Delete area map error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete area map' },
      { status: 500 }
    );
  }
}
