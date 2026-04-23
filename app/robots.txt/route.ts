import { NextResponse } from 'next/server';

// Cache the response for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    // During build time, return default content
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      const defaultContent = `User-agent: *
Disallow: /admin/
Disallow: /login`;

      return new NextResponse(defaultContent, {
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
      .where(eq(settings.key, 'robots_txt'))
      .limit(1);

    const content = data?.value || `User-agent: *
Disallow: /admin/
Disallow: /login`;

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return new NextResponse('User-agent: *\nDisallow: /admin/', {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
