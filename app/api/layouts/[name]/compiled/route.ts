import { NextRequest, NextResponse } from 'next/server';
import { getCompiledLayout } from '@/lib/layout-compiler';

// Force dynamic — no caching, always fresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/layouts/[name]/compiled - Fetch pre-compiled layout HTML
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const layoutName = decodeURIComponent(params.name);
    
    // Try to get pre-compiled layout
    const compiled = await getCompiledLayout(layoutName);
    
    if (compiled) {
      return NextResponse.json({ 
        success: true, 
        data: compiled,
        compiled: true,
        renderTime: '0.1ms' // Pre-compiled is instant
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      });
    }
    
    // No compiled version available
    return NextResponse.json({ 
      success: false, 
      error: 'Compiled layout not found',
      message: 'Layout needs to be compiled first'
    }, { status: 404 });
    
  } catch (error) {
    console.error('[GET /api/layouts/:name/compiled] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compiled layout' },
      { status: 500 }
    );
  }
}
