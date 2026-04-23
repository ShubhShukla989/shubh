import { db } from '@/lib/db';
import { epaper_categories } from '@/lib/schema';
import { deleteCachePattern } from './redis';
import { invalidateAllLayoutsCache } from './layouts';
import { invalidateWidgetCaches } from './universal';

export async function getCachedCategories() {
  // No Redis cache — always fetch fresh from DB
  return await db.select().from(epaper_categories);
}

export async function invalidateCategoriesCache() {
  await deleteCachePattern('categories:*');
  
  // 🔥 CRITICAL FIX: Also invalidate layout compiled cache
  // Categories are used in featured widgets, so layout cache must be cleared
  await invalidateAllLayoutsCache();
  
  // Also clear compiled layout cache specifically
  await deleteCachePattern('layout:compiled:*');
  
  console.log('🔄 Invalidated cache for all categories');
  console.log('🔄 Invalidated compiled layout cache (category dependency)');
}

/**
 * 🔥 COMPREHENSIVE CATEGORY CACHE INVALIDATION
 * 
 * This function handles ALL cache layers that depend on categories:
 * - Categories cache (Redis)
 * - Layout compiled cache (Redis) - CRITICAL for featured widgets
 * - Next.js route cache (ISR)
 * - Edition cache (categories affect edition display)
 */
export async function invalidateAllCategoryDependencies() {
  try {
    console.log('🔄 Starting comprehensive category cache invalidation...');
    
    // Use universal cache invalidation (includes layout:compiled:* clearing)
    await invalidateWidgetCaches();
    
    console.log('✅ Comprehensive category cache invalidation completed');
    
  } catch (error) {
    console.error('❌ Failed comprehensive category cache invalidation:', error);
    throw error;
  }
}
