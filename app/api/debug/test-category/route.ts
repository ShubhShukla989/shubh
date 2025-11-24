import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/debug/test-category
 * Test if a category_id exists and can be used
 */
export async function POST(request: NextRequest) {
  try {
    const { category_id } = await request.json();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Check if category exists
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('epaper_categories')
      .select('*')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({
        success: false,
        error: `Category with ID ${category_id} does not exist`,
        details: {
          category_id,
          exists: false,
          error: categoryError?.message,
        },
      });
    }

    // Try to create a test edition
    const testEdition = {
      title: `Test Edition - ${Date.now()}`,
      alias: `test-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category_id: Number(category_id),
      status: 'draft',
    };

    const { data: edition, error: editionError } = await supabaseAdmin
      .from('editions')
      .insert([testEdition])
      .select()
      .single();

    if (editionError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create test edition',
        details: {
          category_id,
          category_exists: true,
          category_data: category,
          edition_error: editionError.message,
          edition_payload: testEdition,
        },
      });
    }

    // Delete the test edition
    await supabaseAdmin.from('editions').delete().eq('id', edition.id);

    return NextResponse.json({
      success: true,
      message: 'Category can be used successfully',
      details: {
        category_id,
        category_exists: true,
        category_data: category,
        test_edition_created: true,
      },
    });
  } catch (error) {
    console.error('Test category error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
