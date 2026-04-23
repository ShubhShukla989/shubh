import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  try {
    // Resolve relative URLs to absolute using the server's base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;

    const res = await fetch(absoluteUrl, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());

    // Get image metadata to calculate crop
    const meta = await sharp(buffer).metadata();
    const srcWidth = meta.width || 800;
    const srcHeight = meta.height || 1200;

    // Target: 1200x630 landscape (standard OG)
    const targetW = 1200;
    const targetH = 630;

    // Scale so width fills 1200px, then crop from top (newspaper header is most important)
    const scale = targetW / srcWidth;
    const scaledH = Math.round(srcHeight * scale);

    const output = await sharp(buffer)
      .resize(targetW, scaledH)
      .extract({ left: 0, top: 0, width: targetW, height: Math.min(targetH, scaledH) })
      .jpeg({ quality: 90 })
      .toBuffer();

    return new NextResponse(output as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('[og-image] Error:', err);
    return new NextResponse('Failed to process image', { status: 500 });
  }
}
