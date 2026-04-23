import { NextRequest, NextResponse } from 'next/server';
import redis, { deleteCachePattern } from '@/lib/cache/redis';
import { requireAuth } from '@/lib/requireAuth';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAuth();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { pattern } = body;
    
    if (pattern) {
      // Clear specific pattern
      await deleteCachePattern(pattern);
      
      return NextResponse.json({
        success: true,
        message: `Cleared cache matching pattern: ${pattern}`
      });
    } else {
      // Clear all cache
      await redis.flushdb();
      
      return NextResponse.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
