import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_clips } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Fetch all clips
    const clips = await db.select().from(epaper_clips);
    
    const results = {
      total: clips.length,
      broken: [] as number[],
      valid: 0
    };

    for (const clip of clips) {
      // Check if it's a file path (not base64)
      if (!clip.image_url.startsWith('data:image')) {
        // Check if file exists
        const filePath = path.join(process.cwd(), 'public', clip.image_url);
        
        if (!fs.existsSync(filePath)) {
          results.broken.push(clip.id);
        } else {
          // Check file size (should be > 1000 bytes for valid image)
          const stats = fs.statSync(filePath);
          if (stats.size < 1000) {
            results.broken.push(clip.id);
          } else {
            results.valid++;
          }
        }
      } else {
        // Base64 clips are valid
        results.valid++;
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error checking clips:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Fetch all clips
    const clips = await db.select().from(epaper_clips);
    
    const results = {
      total: clips.length,
      deleted: [] as number[],
      kept: 0
    };

    for (const clip of clips) {
      let shouldDelete = false;
      
      // Check if it's a file path (not base64)
      if (!clip.image_url.startsWith('data:image')) {
        // Check if file exists
        const filePath = path.join(process.cwd(), 'public', clip.image_url);
        
        if (!fs.existsSync(filePath)) {
          shouldDelete = true;
        } else {
          // Check file size
          const stats = fs.statSync(filePath);
          if (stats.size < 1000) {
            shouldDelete = true;
            // Also delete the corrupt file
            fs.unlinkSync(filePath);
          }
        }
      }

      if (shouldDelete) {
        await db.delete(epaper_clips).where(eq(epaper_clips.id, clip.id));
        results.deleted.push(clip.id);
      } else {
        results.kept++;
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error deleting clips:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
