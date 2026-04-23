import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { epaper_clips } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let imageBuffer: Buffer;
  let edition_id: number;
  let page_number: number;

  try {
    const form = await request.formData();
    const imageFile = form.get('image') as File | null;
    edition_id = parseInt(form.get('edition_id') as string || '0');
    page_number = parseInt(form.get('page_number') as string || '1');

    if (!edition_id || isNaN(edition_id)) {
      console.error('clips/save: invalid edition_id:', form.get('edition_id'));
      return NextResponse.json({ success: false, error: 'Missing edition_id' }, { status: 400 });
    }
    if (!imageFile || imageFile.size === 0) {
      console.error('clips/save: missing or empty image');
      return NextResponse.json({ success: false, error: 'Missing image' }, { status: 400 });
    }
    imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  } catch (err) {
    console.error('clips/save: failed to parse request:', err);
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Insert clip record
    const [savedClip] = await db.insert(epaper_clips).values({
      image_url: '',
      clip_url: '',
      edition_id,
      page_number,
      created_at: new Date().toISOString(),
    }).returning();

    const clipUrl = `${siteUrl}/epaper/clip/${savedClip.id}`;

    // Detect format from magic bytes
    let ext = 'jpg';
    if (imageBuffer.length > 12 &&
        imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49 &&
        imageBuffer[8] === 0x57 && imageBuffer[9] === 0x45) {
      ext = 'webp';
    } else if (imageBuffer.length > 4 &&
               imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
      ext = 'png';
    }

    // Save file directly — watermark already applied client-side
    const fileName = `clip-${savedClip.id}.${ext}`;
    // Use UPLOAD_DIR if set (absolute path, works in standalone mode), else fallback
    const uploadsBase = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    const uploadsDir = path.join(uploadsBase, 'clips');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, fileName), imageBuffer);

    const imageUrl = `/uploads/clips/${fileName}`;

    await db.update(epaper_clips)
      .set({ image_url: imageUrl, clip_url: clipUrl })
      .where(eq(epaper_clips.id, savedClip.id));

    return NextResponse.json({
      success: true,
      data: {
        id: savedClip.id,
        image_url: imageUrl,
        clip_url: clipUrl,
        edition_id: savedClip.edition_id,
        page_number: savedClip.page_number,
        created_at: savedClip.created_at,
      },
    });
  } catch (error: any) {
    console.error('Clip save error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
