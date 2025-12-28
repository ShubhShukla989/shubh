import { NextRequest, NextResponse } from 'next/server';
import { invalidateCacheByTags, deleteCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tags, key } = body;
    
    if (key) {
      // Clear specific cache key
      deleteCache(key);
    } else if (tags && Array.isArray(tags)) {
      // Clear by tags
      invalidateCacheByTags(tags);
    } else {
      // Clear all cache
      invalidateCacheByTags([]);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}