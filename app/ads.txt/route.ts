import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // During build time, return empty content
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return new NextResponse('', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const { db } = await import('@/lib/db');
    const { settings } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');

    const [data] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'ads_txt'))
      .limit(1);

    const content = data?.value || '';

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Serve ads.txt error:', error);
    return new NextResponse('', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
