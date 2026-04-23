import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simple in-memory rate limiting for middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkGlobalRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 500; // 500 requests
  const window = 60 * 1000; // per minute
  
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Global rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 
                request.ip || 
                'unknown';
    
    if (!checkGlobalRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }
  }
  
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
    // User API routes - no browser cache so widget updates are instant
    else if (pathname.match(/\/(editions|categories|epaper)/)) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Vary', 'Accept-Encoding');
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
