import { db } from '@/lib/db';
import { editions } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { deleteCache, deleteCachePattern } from './redis';
import { invalidateWidgetCaches } from './universal';

export async function getCachedEdition(editionId: number) {
  // No Redis cache — always fetch fresh from DB
  const [edition] = await db
    .select()
    .from(editions)
    .where(eq(editions.id, editionId))
    .limit(1);
  return edition || null;
}

export async function getCachedEditionsByCategory(categoryId: number) {
  // No Redis cache — always fetch fresh from DB
  return await db
    .select()
    .from(editions)
    .where(eq(editions.category_id, categoryId))
    .orderBy(desc(editions.date));
}

export async function invalidateEditionCache(editionId: number) {
  await deleteCache(`edition:${editionId}`);
  
  // Also invalidate category cache
  const edition = await db
    .select()
    .from(editions)
    .where(eq(editions.id, editionId))
    .limit(1);
  
  if (edition[0]) {
    await deleteCache(`editions:category:${edition[0].category_id}`);
  }
  
  // 🚀 CRITICAL: Clear layout compiled cache for widget updates
  await invalidateWidgetCaches();
  
  console.log(`🔄 Invalidated cache for edition: ${editionId}`);
}

export async function invalidateAllEditionsCache() {
  // 🚀 Use universal cache invalidation
  await invalidateWidgetCaches();
  console.log('🔄 Invalidated cache for all editions');
}
