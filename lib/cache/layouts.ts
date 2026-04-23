import { db } from '@/lib/db';
import { layouts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { deleteCache } from './redis';

export async function getCachedLayout(layoutName: string) {
  // No Redis cache — always fetch fresh from DB so layout changes reflect instantly
  const [layout] = await db
    .select()
    .from(layouts)
    .where(eq(layouts.name, layoutName))
    .limit(1);
  return layout || null;
}

export async function invalidateLayoutCache(layoutName: string) {
  await deleteCache(`layout:${layoutName}`);
  console.log(`🔄 Invalidated cache for layout: ${layoutName}`);
}

export async function getAllCachedLayouts() {
  // No Redis cache — always fetch fresh from DB
  return await db.select().from(layouts);
}

export async function invalidateAllLayoutsCache() {
  await deleteCache('layouts:all');
  console.log('🔄 Invalidated cache for all layouts');
}
