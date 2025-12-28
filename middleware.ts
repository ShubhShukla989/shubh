import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Check if accessing admin routes
  if (pathname.startsWith('/admin')) {
    // Check for NextAuth session token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // If no valid token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // EXTREME caching for 1000+ concurrent users on Hostinger VPS
  if (pathname.startsWith('/api/')) {
    // Admin API routes - no caching
    if (pathname.includes('/admin/') || pathname.includes('/auth/') || pathname.includes('/upload/')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    // User API routes - AGGRESSIVE cache for performance
    else if (pathname.match(/\/(editions|categories|epaper)/)) {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600');
      response.headers.set('Vary', 'Accept-Encoding');
      response.headers.set('X-Accel-Expires', '1800'); // Nginx cache for 30 minutes
    }
  }
  
  // Media files - EXTREME caching for millisecond PDF loading
  if (pathname.startsWith('/uploads/')) {
    response.headers.set('Cache-Control', 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=7776000');
    response.headers.set('Vary', 'Accept-Encoding');
    response.headers.set('X-Accel-Expires', '2592000'); // Nginx cache for 1 month
    response.headers.set('X-Accel-Buffering', 'yes'); // Enable Nginx buffering
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/uploads/:path*'],
};
