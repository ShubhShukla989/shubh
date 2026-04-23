/**
 * Cache utility functions for clearing Next.js cache after content updates
 */

/**
 * Clear cache for specific paths after content update
 */
export async function clearCacheAfterUpload(categoryAlias?: string) {
  try {
    const paths = [
      '/',
      '/epaper/display',
    ];

    if (categoryAlias) {
      paths.push(`/epaper/category/${categoryAlias}`);
    }

    // Clear all paths
    await Promise.all(
      paths.map(path =>
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        })
      )
    );

    console.log('✅ Cache cleared for paths:', paths);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Clear all edition-related cache
 */
export async function clearEditionCache() {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/cache/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'editions' }),
    });
    console.log('✅ Edition cache cleared');
  } catch (error) {
    console.error('Failed to clear edition cache:', error);
  }
}
