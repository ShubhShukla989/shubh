import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { edition_pages } from '@/lib/schema';
import { like } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// POST /api/admin/fix-page-urls
// Fixes image_url in DB where .jpg is stored but actual file is .png
export async function POST() {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    // Get all pages with .jpg image_url
    const pages = await db
      .select()
      .from(edition_pages)
      .where(like(edition_pages.image_url, '%.jpg'));

    let fixed = 0;
    for (const page of pages) {
      if (!page.image_url) continue;

      // Check if .jpg exists
      const jpgPath = path.join(process.cwd(), 'public', page.image_url);
      if (fs.existsSync(jpgPath)) continue; // .jpg exists, no fix needed

      // Check if .png exists instead
      const pngUrl = page.image_url.replace(/\.jpg$/, '.png');
      const pngPath = path.join(process.cwd(), 'public', pngUrl);
      if (!fs.existsSync(pngPath)) continue; // neither exists, skip

      // Fix: update image_url to .png
      await db
        .update(edition_pages)
        .set({ image_url: pngUrl })
        .where(like(edition_pages.image_url, page.image_url));

      fixed++;
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} of ${pages.length} pages`,
      total: pages.length,
      fixed,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
