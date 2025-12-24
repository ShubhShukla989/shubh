import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
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
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Serve robots.txt error:', error);
    return new NextResponse('User-agent: *\nDisallow: /admin/', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
