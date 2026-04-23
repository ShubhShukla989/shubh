/**
 * Universal Cache Invalidation
 */

import { deleteCachePattern } from './redis';
import { invalidateAllLayoutsCache } from './layouts';

// ─── Debounce map for granular invalidation ───────────────────────────────────
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 200;

/**
 * Granular cache invalidation — only clears the keys you specify.
 * Debounced: rapid calls with the same key set collapse into one operation.
 */
export function invalidateCacheKeysAsync(patterns: string[]) {
  const groupKey = [...patterns].sort().join('|');

  const existing = debounceTimers.get(groupKey);
  if (existing) clearTimeout(existing);

  debounceTimers.set(groupKey, setTimeout(async () => {
    debounceTimers.delete(groupKey);
    try {
      for (const pattern of patterns) {
        await deleteCachePattern(pattern);
      }
      console.log('[cache] invalidated', { patterns });
    } catch (err) {
      console.error('[cache] invalidation failed', { patterns, err });
    }
  }, DEBOUNCE_MS));
}

/**
 * Synchronous granular invalidation — awaitable.
 */
export async function invalidateCacheKeys(patterns: string[]) {
  try {
    for (const pattern of patterns) {
      await deleteCachePattern(pattern);
    }
    console.log('[cache] invalidated', { patterns });
  } catch (err) {
    console.error('[cache] invalidation failed', { patterns, err });
    throw err;
  }
}

/**
 * Full widget cache nuke — use for broad changes (edition publish/delete, category changes).
 * Existing callers kept working — do not remove.
 */
export async function invalidateWidgetCaches() {
  try {
    await deleteCachePattern('categories:*');
    await deleteCachePattern('editions:*');
    await deleteCachePattern('edition:*');
    await deleteCachePattern('epaper:editions-by-category:*');
    await deleteCachePattern('epaper:edition-dates:*');
    await deleteCachePattern('editions:latest-by-categories:*');
    await deleteCachePattern('menu:*');
    await deleteCachePattern('slider:*');
    await deleteCachePattern('pages:*');
    await deleteCachePattern('layout:compiled:*');
    await deleteCachePattern('layout:menu:*');
    await deleteCachePattern('layout:slider:*');
    await deleteCachePattern('layout:page:*');
    await invalidateAllLayoutsCache();
    console.log('[cache] full widget cache invalidated');
  } catch (error) {
    console.error('[cache] full invalidation failed', { error });
    throw error;
  }
}

export function invalidateWidgetCachesAsync() {
  invalidateWidgetCaches().catch(err =>
    console.error('[cache] async full invalidation failed', { err })
  );
}
