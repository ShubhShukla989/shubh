import { NextRequest, NextResponse } from 'next/server';
import { getCompleteEdition } from '@/lib/services/editionService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const editionId = parseInt(params.id);

    if (isNaN(editionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid edition ID' },
        { status: 400 }
      );
    }

    // Use service layer for data fetching
    const data = await getCompleteEdition(editionId);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Edition not found' },
        { status: 404 }
      );
    }

    // Return combined data
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        // Prevent CDN caching
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error fetching complete edition data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}