import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media_files } from '@/lib/schema/media';
import { desc } from 'drizzle-orm';

// GET /api/media - Get all media files
export async function GET() {
  try {
    console.log('🔍 Media API called at:', new Date().toISOString());
    const files = await db.select().from(media_files).orderBy(desc(media_files.created_at));
    console.log('📁 Found files in database:', files.length);
    
    // Transform to match MediaBrowser expected format
    const transformedFiles = files.map(file => ({
      id: file.id.toString(),
      url: file.file_url,
      name: file.original_name || file.filename,
      size: file.file_size || 0,
      type: file.mime_type || 'image/jpeg',
      createdAt: file.created_at || new Date().toISOString()
    }));
    
    console.log('📤 Returning files:', transformedFiles.map(f => f.name));
    
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
      { success: false, error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}