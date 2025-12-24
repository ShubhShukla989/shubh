import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { media_files } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/media/create-record
 * Create a database record for an existing storage file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, url, size, type } = body;

    if (!filename || !url) {
      return NextResponse.json(
        { success: false, error: 'Filename and URL are required' },
        { status: 400 }
      );
    }

    // Check if record already exists
    const [existing] = await db
      .select()
      .from(media_files)
      .where(eq(media_files.filename, filename))
      .limit(1);

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Record already exists',
      });
    }

    // Create new record
    const [data] = await db
      .insert(media_files)
      .values({
        filename,
        original_name: filename,
        file_path: `media/${filename}`,
        file_url: url,
        file_size: size || 0,
        mime_type: type || 'image/*',
        title: filename,
        alt_text: '',
      })
      .returning();

    return NextResponse.json({
      success: true,
      data,
      message: 'Media record created successfully',
    });
  } catch (error: any) {
    console.error('Create record error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create record' },
      { status: 500 }
    );
  }
}
