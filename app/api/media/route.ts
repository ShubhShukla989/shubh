import { NextRequest, NextResponse } from 'next/server';

// Force dynamic — disable Next.js data cache for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/media - Get all media files
export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    const { media_files } = await import('@/lib/schema/media');
    const { desc } = await import('drizzle-orm');
    
    const files = await db.select().from(media_files).orderBy(desc(media_files.created_at));
    
    // Transform to match MediaBrowser expected format
    const transformedFiles = files.map(file => ({
      id: file.id.toString(),
      url: file.file_url,
      name: file.original_name || file.filename,
      size: file.file_size || 0,
      type: file.mime_type || 'image/jpeg',
      createdAt: file.created_at || new Date().toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: transformedFiles
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media files', data: [] },
      { status: 500 }
    );
  }
}