'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, ComponentProps } from 'react';
import { markRoutePrefetched } from '@/hooks/useNavigationMetrics';

interface PrefetchLinkProps extends ComponentProps<typeof Link> {
  prefetchDelay?: number;
}

/**
 * Elite Link component with hover prefetch
 * Prefetches route after hover delay to avoid unnecessary requests
 */
export default function PrefetchLink({ 
  href, 
  prefetchDelay = 150,
  onMouseEnter,
  onMouseLeave,
  children,
  ...props 
}: PrefetchLinkProps) {
  const router = useRouter();
  const [isPrefetched, setIsPrefetched] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call original onMouseEnter if provided
    onMouseEnter?.(e);

    // Don't prefetch if already done
    if (isPrefetched) return;

    // Start prefetch timer
    hoverTimerRef.current = setTimeout(() => {
      const hrefString = typeof href === 'string' ? href : href.pathname || '';
      router.prefetch(hrefString);
      setIsPrefetched(true);
      
      // Mark as prefetched for metrics
      markRoutePrefetched(hrefString);
      
      // Remove console.log in production
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Prefetched:', hrefString);
      }
    }, prefetchDelay);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call original onMouseLeave if provided
    onMouseLeave?.(e);

    // Clear timer if user leaves before delay
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      prefetch={false} // Disable auto-prefetch, we control it
      {...props}
    >
      {children}
    </Link>
  );
}
