import { db } from '@/lib/db';
import { site_settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { deleteCache } from './redis';

export async function getCachedSiteSettings() {
  // No Redis cache — always fetch fresh from DB
  const [data] = await db
    .select()
    .from(site_settings)
    .where(eq(site_settings.setting_key, 'home_page'))
    .limit(1);

  return data || { 
    setting_value: 'website-homepage', 
    homepage_layout: 'Website Homepage' 
  };
}

export async function invalidateSiteSettingsCache() {
  await deleteCache('settings:site:home_page');
  console.log('🔄 Invalidated cache for site settings');
}

// ─── Shared in-process watermark image cache ─────────────────────────────────
// Shared here so invalidate-cache route can clear it instantly on settings save.

const watermarkMemCache = new Map<number, { url: string; timestamp: number }>();
const WATERMARK_MEM_TTL = 0; // No TTL — cleared explicitly on settings change
const WATERMARK_MEM_MAX = 1000;

export function getWatermarkFromMemCache(id: number): string | null {
  const entry = watermarkMemCache.get(id);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > WATERMARK_MEM_TTL) { watermarkMemCache.delete(id); return null; }
  return entry.url;
}

export function setWatermarkInMemCache(id: number, url: string) {
  if (watermarkMemCache.size >= WATERMARK_MEM_MAX) {
    const oldest = watermarkMemCache.keys().next().value;
    if (oldest !== undefined) watermarkMemCache.delete(oldest);
  }
  watermarkMemCache.set(id, { url, timestamp: Date.now() });
}

export function clearWatermarkMemCache() {
  watermarkMemCache.clear();
}
