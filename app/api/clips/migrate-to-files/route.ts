import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_clips } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Fetch all clips
    const clips = await db.select().from(epaper_clips);
    
    const results = {
      total: clips.length,
      migrated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'clips');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const clip of clips) {
      try {
        // Check if it's base64 data
        if (clip.image_url.startsWith('data:image')) {
          // Convert base64 to file
          const fileName = `clip-${clip.id}.png`;
          const filePath = path.join(uploadsDir, fileName);
          
          const base64Data = clip.image_url.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buffer);

          // Update database with file path
          const imageUrl = `/uploads/clips/${fileName}`;
          await db.update(epaper_clips)
            .set({ image_url: imageUrl })
            .where(eq(epaper_clips.id, clip.id));

          results.migrated++;
        } else {
          // Already a file path, skip
          results.skipped++;
        }
      } catch (error) {
        results.errors.push(`Clip ${clip.id}: ${error}`);
        console.error('Error migrating clip:', error);
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
