import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { invalidateAllCategoryDependencies } from '@/lib/cache/categories';
import { deleteCachePattern } from '@/lib/cache/redis';

/**
 * 🔥 EMERGENCY: Clear Featured Widget Cache
 * 
 * This endpoint specifically fixes the featured widget not updating issue.
 * Use this if categories are not showing up in the featured widget after changes.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY: Clearing featured widget cache...');
    
    // 1. Clear ALL category-dependent caches
    await invalidateAllCategoryDependencies();
    
    // 2. Force clear layout compiled cache (double-check)
    await deleteCachePattern('layout:compiled:*');
    
    // 3. Clear any remaining layout cache
    await deleteCachePattern('layout:*');
    
    // 4. Revalidate all relevant pages
    revalidatePath('/', 'page'); // Homepage
    revalidatePath('/epaper', 'page'); // EPaper section
    revalidatePath('/epaper/display', 'page'); // Display page
    revalidatePath('/epaper/archive', 'page'); // Archive page
    
    console.log('✅ EMERGENCY: Featured widget cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Featured widget cache cleared successfully',
      clearedCaches: [
        'categories:*',
        'layout:compiled:* (CRITICAL FIX)',
        'layout:*',
        'editions:*'
      ],
      revalidatedPaths: [
        '/',
        '/epaper',
        '/epaper/display',
        '/epaper/archive'
      ],
      instructions: 'Featured widget should now show updated categories immediately'
    });
    
  } catch (error) {
    console.error('❌ EMERGENCY: Failed to clear featured widget cache:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear featured widget cache',
      message: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Check Redis connection',
        'Verify cache functions are working',
        'Try manual browser refresh',
        'Check server logs for detailed errors'
      ]
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/cache/clear-featured-widget',
    purpose: 'Emergency cache clear for featured widget not updating',
    usage: 'POST request to clear all category-dependent caches',
    fix: 'Clears layout compiled cache which was causing featured widget to show old categories'
  });
}