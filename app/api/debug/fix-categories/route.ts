import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/debug/fix-categories
 * Activates all inactive categories
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get all inactive categories
    const { data: inactiveCategories, error: fetchError } = await supabaseAdmin
      .from('epaper_categories')
      .select('id, title, alias, is_active')
      .eq('is_active', false);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!inactiveCategories || inactiveCategories.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All categories are already active',
        data: { fixed: 0, categories: [] },
      });
    }

    // Activate all inactive categories
    const { data: updatedCategories, error: updateError } = await supabaseAdmin
      .from('epaper_categories')
      .update({ is_active: true })
      .eq('is_active', false)
      .select();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully activated ${inactiveCategories.length} categories`,
      data: {
        fixed: inactiveCategories.length,
        categories: inactiveCategories.map(c => ({
          id: c.id,
          title: c.title,
          alias: c.alias,
        })),
      },
    });
  } catch (error) {
    console.error('Fix categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix categories' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/debug/fix-categories
 * Check which categories are inactive
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { data: allCategories, error: allError } = await supabaseAdmin
      .from('epaper_categories')
      .select('id, title, alias, is_active, is_featured')
      .order('display_order');

    if (allError) {
      return NextResponse.json(
        { success: false, error: allError.message },
        { status: 500 }
      );
    }

    const active = allCategories?.filter(c => c.is_active) || [];
    const inactive = allCategories?.filter(c => !c.is_active) || [];

    return NextResponse.json({
      success: true,
      data: {
        total: allCategories?.length || 0,
        active: active.length,
        inactive: inactive.length,
        categories: {
          active,
          inactive,
        },
      },
    });
  } catch (error) {
    console.error('Check categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check categories' },
      { status: 500 }
    );
  }
}
