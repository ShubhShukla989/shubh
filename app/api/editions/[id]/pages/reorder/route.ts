import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { pageId, direction } = body;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get all pages for this edition
    const { data: pages, error: fetchError } = await supabaseAdmin
      .from('edition_pages')
      .select('*')
      .eq('edition_id', id)
      .order('page_number', { ascending: true });

    if (fetchError || !pages) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pages' },
        { status: 500 }
      );
    }

    // Find the page to move
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Calculate new position
    const newIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1;
    
    if (newIndex < 0 || newIndex >= pages.length) {
      return NextResponse.json(
        { success: false, error: 'Cannot move page in that direction' },
        { status: 400 }
      );
    }

    // Swap page numbers by updating both at once with RPC or by deleting and reinserting
    const currentPage = pages[pageIndex];
    const targetPage = pages[newIndex];

    // Use negative numbers temporarily to avoid unique constraint issues
    const tempCurrent = -(currentPage.page_number);
    const tempTarget = -(targetPage.page_number);

    // Step 1: Set both to negative (temporary) values
    await supabaseAdmin
      .from('edition_pages')
      .update({ page_number: tempCurrent })
      .eq('id', currentPage.id);

    await supabaseAdmin
      .from('edition_pages')
      .update({ page_number: tempTarget })
      .eq('id', targetPage.id);

    // Step 2: Swap to final values
    const { error: error1 } = await supabaseAdmin
      .from('edition_pages')
      .update({ page_number: targetPage.page_number })
      .eq('id', currentPage.id);

    const { error: error2 } = await supabaseAdmin
      .from('edition_pages')
      .update({ page_number: currentPage.page_number })
      .eq('id', targetPage.id);

    if (error1 || error2) {
      console.error('Swap errors:', { error1, error2 });
      return NextResponse.json(
        { success: false, error: 'Failed to update page order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Page order updated successfully',
    });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder pages' },
      { status: 500 }
    );
  }
}
