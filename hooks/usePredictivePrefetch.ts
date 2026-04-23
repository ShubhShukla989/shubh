/**
 * Predictive Prefetch Hook
 * 
 * Automatically prefetches likely next routes based on current page pattern
 * Uses pattern-based matching instead of static mapping
 * Inspired by Linear and Vercel dashboards
 * 
 * Usage:
 * ```tsx
 * usePredictivePrefetch();
 * ```
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Pattern-based route prediction
 * More flexible than static mapping
 */
function getPredictiveRoutes(pathname: string): string[] {
  const routes: string[] = [];

  // Pattern 1: List pages → prefetch create page
  // /admin/editions → /admin/editions/create
  if (pathname.match(/^\/admin\/[^/]+$/)) {
    routes.push(`${pathname}/create`);
  }

  // Pattern 2: EPaper list pages → prefetch create
  // /admin/epaper/categories → /admin/epaper/categories/create
  if (pathname.match(/^\/admin\/epaper\/[^/]+$/)) {
    routes.push(`${pathname}/create`);
  }

  // Pattern 3: Users page → prefetch permissions
  if (pathname === '/admin/users') {
    routes.push('/admin/users/permissions');
  }

  // Pattern 4: Media page → prefetch tags
  if (pathname === '/admin/media') {
    routes.push('/admin/media/tags');
  }

  // Pattern 5: Designer page → prefetch edit
  if (pathname === '/admin/designer') {
    routes.push('/admin/designer/edit');
  }

  // Pattern 6: Edition detail → prefetch edit and pages
  // /admin/editions/[id] → /admin/editions/[id]/edit
  const editionMatch = pathname.match(/^\/admin\/editions\/(\d+)$/);
  if (editionMatch) {
    const id = editionMatch[1];
    routes.push(`/admin/editions/${id}/edit`);
    routes.push(`/admin/editions/${id}/pages`);
  }

  return routes;
}

export function usePredictivePrefetch() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Get predictive routes based on pattern matching
    const routes = getPredictiveRoutes(pathname);
    
    if (routes.length === 0) {
      return;
    }

    // Prefetch after a short delay (avoid blocking initial render)
    const timer = setTimeout(() => {
      routes.forEach(route => {
        router.prefetch(route);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔮 Predictive prefetch:', route);
        }
      });
    }, 500); // Wait 500ms after page load

    return () => clearTimeout(timer);
  }, [pathname, router]);
}
