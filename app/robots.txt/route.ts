import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'robots_txt')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

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
