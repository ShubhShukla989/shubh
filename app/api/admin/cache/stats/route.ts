import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats();
    
    // Calculate total size
    const totalSize = stats.entries.reduce((sum, entry) => sum + entry.size, 0);
    
    // Calculate hit rate (placeholder - implement proper tracking)
    const hitRate = 0.75; // 75% placeholder
    
    return NextResponse.json({
      success: true,
      data: {
        size: stats.size,
        hitRate,
        totalSize,
        entries: stats.entries,
      },
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}