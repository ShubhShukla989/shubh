import { NextRequest, NextResponse } from 'next/server';
import { warmCache } from '@/lib/cache/warming';
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
    const result = await warmCache();
    
    return NextResponse.json({
      success: result.success,
      message: `Cache warmed: ${result.warmed} items in ${result.duration}ms`,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
