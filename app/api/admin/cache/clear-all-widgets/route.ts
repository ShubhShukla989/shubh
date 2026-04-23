import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { invalidateWidgetCaches } from '@/lib/cache/universal';

/**
 * 🚀 EMERGENCY: Clear ALL Widget Caches
 * 
 * This endpoint fixes ALL dynamic widgets not updating in production.
 * Use this if any widget (featured, menu, slider, etc.) is not showing changes.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY: Clearing ALL widget caches...');
    
    // 🚀 UNIVERSAL CACHE INVALIDATION
    await invalidateWidgetCaches();
    
    // Revalidate all relevant pages
    revalidatePath('/', 'page'); // Homepage
    revalidatePath('/epaper', 'page'); // EPaper section
    revalidatePath('/epaper/display', 'page'); // Display page
    revalidatePath('/epaper/archive', 'page'); // Archive page
    
    console.log('✅ EMERGENCY: ALL widget caches cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'ALL widget caches cleared successfully',
      clearedCaches: [
        'categories:* (Featured Widget)',
        'editions:* (Featured Editions Widget)',
        'menu:* (Menu/Navigation Widget)',
        'slider:* (Slider Widget)',
        'pages:* (Page Widgets)',
        'layout:compiled:* (CRITICAL FIX!)',
        'layout:* (Layout Cache)'
      ],
      revalidatedPaths: [
        '/',
        '/epaper',
        '/epaper/display',
        '/epaper/archive'
      ],
      instructions: 'ALL dynamic widgets should now show updated content immediately',
      affectedWidgets: [
        'Featured Categories Widget',
        'Featured Editions Widget', 
        'Menu Widget',
        'Navigation Widget',
        'Slider Widget',
        'EPaper Calendar Widget',
        'EPaper Archive Widget',
        'EPaper Area Map Widget'
      ]
    });
    
  } catch (error) {
    console.error('❌ EMERGENCY: Failed to clear ALL widget caches:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear ALL widget caches',
      message: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Check Redis connection',
        'Verify universal cache function is working',
        'Try manual browser refresh',
        'Check server logs for detailed errors',
        'Restart Redis service if needed'
      ]
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/cache/clear-all-widgets',
    purpose: 'Emergency cache clear for ALL dynamic widgets not updating',
    usage: 'POST request to clear all widget-dependent caches',
    fix: 'Clears layout compiled cache which was causing ALL widgets to show old data',
    affectedWidgets: [
      'Featured Categories Widget',
      'Featured Editions Widget', 
      'Menu Widget',
      'Navigation Widget',
      'Slider Widget',
      'EPaper Calendar Widget',
      'EPaper Archive Widget',
      'EPaper Area Map Widget'
    ],
    note: 'This is the COMPREHENSIVE fix for the production cache issue'
  });
}