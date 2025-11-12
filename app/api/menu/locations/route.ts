import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/menu/locations - Get available menu locations
 */
export async function GET(request: NextRequest) {
  try {
    // Return predefined menu locations
    const locations = [
      { id: 'main-nav', name: 'main-nav', label: 'Main Navigation' },
      { id: 'footer', name: 'footer', label: 'Footer Menu' },
      { id: 'top-bar', name: 'top-bar', label: 'Top Bar' },
      { id: 'sidebar', name: 'sidebar', label: 'Sidebar Menu' },
    ];

    return NextResponse.json(locations);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
