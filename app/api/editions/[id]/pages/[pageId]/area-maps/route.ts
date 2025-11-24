import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; pageId: string } }
) {
  try {
    const { pageId } = params;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('area_maps')
      .select('*')
      .eq('page_id', pageId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
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
    const { pageId } = params;
    const body = await request.json();
    const { areaMaps } = body;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // IMPORTANT: Don't delete and recreate - UPDATE existing areas instead
    // This preserves IDs so linked_area_ids remain valid
    
    // Get existing areas for this page
    const { data: existingAreas } = await supabaseAdmin
      .from('area_maps')
      .select('id')
      .eq('page_id', pageId);
    
    const existingIds = new Set((existingAreas || []).map(a => a.id));
    const incomingIds = new Set(areaMaps.filter((a: any) => a.id).map((a: any) => a.id));
    
    // Delete areas that are no longer present
    const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
    if (idsToDelete.length > 0) {
      await supabaseAdmin
        .from('area_maps')
        .delete()
        .in('id', idsToDelete);
    }
    
    // Separate updates and inserts
    const areasToUpdate = areaMaps.filter((a: any) => a.id && existingIds.has(a.id));
    const areasToInsert = areaMaps.filter((a: any) => !a.id || !existingIds.has(a.id));
    
    // let insertedAreas: any[] = [];
    
    // Update existing areas
    for (const area of areasToUpdate) {
      await supabaseAdmin
        .from('area_maps')
        .update({
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          title: area.title,
          url: area.url,
          linked_area_ids: area.linked_area_ids || [],
        })
        .eq('id', area.id);
    }
    
    // Insert new areas
    if (areasToInsert.length > 0) {
      const { data, error: insertError } = await supabaseAdmin
        .from('area_maps')
        .insert(
          areasToInsert.map((area: any) => ({
            page_id: parseInt(pageId),
            x: area.x,
            y: area.y,
            width: area.width,
            height: area.height,
            title: area.title,
            url: area.url,
            linked_area_ids: area.linked_area_ids || [],
          }))
        )
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
      
      // insertedAreas = data || [];
    }
    
    // Now create bidirectional links for ALL areas on this page
    const { data: allPageAreas } = await supabaseAdmin
      .from('area_maps')
      .select('*')
      .eq('page_id', pageId);
    
    if (allPageAreas && allPageAreas.length > 0) {
      await createBidirectionalLinks(allPageAreas);
    }

    return NextResponse.json({
      success: true,
      message: 'Area maps saved successfully',
    });
  } catch (error) {
    console.error('Save area maps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save area maps' },
      { status: 500 }
    );
  }
}

/**
 * Create bidirectional links between areas
 * If Area A links to [B, C], then B should link to [A, C] and C should link to [A, B]
 * IMPORTANT: This works across ALL pages in the edition, not just current page
 */
async function createBidirectionalLinks(areas: any[]) {
  if (!supabaseAdmin) return;

  // Collect all area IDs that are involved in linking
  const involvedAreaIds = new Set<number>();
  for (const area of areas) {
    involvedAreaIds.add(area.id);
    if (area.linked_area_ids && area.linked_area_ids.length > 0) {
      area.linked_area_ids.forEach((id: number) => involvedAreaIds.add(id));
    }
  }

  // Fetch ALL involved areas from database (including those on other pages)
  const { data: allInvolvedAreas, error } = await supabaseAdmin
    .from('area_maps')
    .select('*')
    .in('id', Array.from(involvedAreaIds));

  if (error || !allInvolvedAreas) {
    console.error('Failed to fetch involved areas:', error);
    return;
  }

  // Build a map of all areas that need to be linked together
  const linkGroups = new Map<number, Set<number>>();

  // First pass: collect all linked area IDs from ALL involved areas
  for (const area of allInvolvedAreas) {
    if (area.linked_area_ids && area.linked_area_ids.length > 0) {
      const allIds = [area.id, ...area.linked_area_ids];
      
      // Create or update the link group
      for (const id of allIds) {
        if (!linkGroups.has(id)) {
          linkGroups.set(id, new Set(allIds));
        } else {
          const existing = linkGroups.get(id)!;
          allIds.forEach((aid: number) => existing.add(aid));
        }
      }
    }
  }

  // Second pass: merge overlapping groups
  // If Area A links to [B, C] and Area B links to [D], then all should be linked: [A, B, C, D]
  let changed = true;
  while (changed) {
    changed = false;
    for (const [, group1] of linkGroups.entries()) {
      for (const id2 of group1) {
        if (linkGroups.has(id2)) {
          const group2 = linkGroups.get(id2)!;
          const sizeBefore = group1.size;
          group2.forEach((id: number) => group1.add(id));
          if (group1.size > sizeBefore) {
            changed = true;
          }
        }
      }
    }
  }

  // Third pass: update ALL areas with their complete link groups
  // This includes areas on other pages!
  for (const [areaId, linkedIds] of linkGroups.entries()) {
    // Remove self from the linked IDs
    const finalLinkedIds = Array.from(linkedIds).filter((id: number) => id !== areaId);
    
    if (finalLinkedIds.length > 0) {
      await supabaseAdmin
        .from('area_maps')
        .update({ linked_area_ids: finalLinkedIds })
        .eq('id', areaId);
    }
  }

  console.log('Bidirectional links created for areas:', Array.from(involvedAreaIds));
}
