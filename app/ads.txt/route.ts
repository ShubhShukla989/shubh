import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // During build time, return empty content
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return new NextResponse('', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
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
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return new NextResponse('', {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
