/**
 * Navigation Performance Metrics Hook
 * 
 * Tracks navigation performance metrics for monitoring and optimization
 * Measures: navigation time, prefetch hit rate, cache hit rate
 * 
 * Usage:
 * ```tsx
 * useNavigationMetrics();
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationMetric {
  route: string;
  startTime: number;
  endTime: number;
  duration: number;
  wasPrefetched: boolean;
  wasCached: boolean;
  timestamp: Date;
}

// In-memory metrics store (could be sent to analytics service)
const metrics: NavigationMetric[] = [];
const MAX_METRICS = 100; // Keep last 100 navigations

// Track prefetch state
const prefetchedRoutes = new Set<string>();

// Mark route as prefetched (called from PrefetchLink)
export function markRoutePrefetched(route: string) {
  prefetchedRoutes.add(route);
}

// Calculate metrics
function calculateMetrics() {
  if (metrics.length === 0) return null;

  const durations = metrics.map(m => m.duration);
  const prefetchHits = metrics.filter(m => m.wasPrefetched).length;
  const cacheHits = metrics.filter(m => m.wasCached).length;

  return {
    // Navigation times
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    p50Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.5)],
    p95Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)],
    p99Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.99)],
    
    // Hit rates
    prefetchHitRate: (prefetchHits / metrics.length) * 100,
    cacheHitRate: (cacheHits / metrics.length) * 100,
    
    // Counts
    totalNavigations: metrics.length,
    prefetchedNavigations: prefetchHits,
    cachedNavigations: cacheHits,
  };
}

// Log metrics summary (dev only)
function logMetricsSummary() {
  if (process.env.NODE_ENV !== 'development') return;
  
  const summary = calculateMetrics();
  if (!summary) return;

  console.group('📊 Navigation Metrics Summary');
  console.log('Total Navigations:', summary.totalNavigations);
  console.log('Avg Duration:', Math.round(summary.avgDuration), 'ms');
  console.log('P50 Duration:', Math.round(summary.p50Duration), 'ms');
  console.log('P95 Duration:', Math.round(summary.p95Duration), 'ms');
  console.log('P99 Duration:', Math.round(summary.p99Duration), 'ms');
  console.log('Prefetch Hit Rate:', summary.prefetchHitRate.toFixed(1), '%');
  console.log('Cache Hit Rate:', summary.cacheHitRate.toFixed(1), '%');
  console.groupEnd();
}

export function useNavigationMetrics() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(0);
  const previousPathnameRef = useRef<string>('');

  useEffect(() => {
    // Skip first render
    if (!previousPathnameRef.current) {
      previousPathnameRef.current = pathname;
      return;
    }

    // Navigation completed
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    
    // Check if route was prefetched
    const wasPrefetched = prefetchedRoutes.has(pathname);
    
    // Heuristic: < 100ms likely from cache
    const wasCached = duration < 100;

    // Record metric
    const metric: NavigationMetric = {
      route: pathname,
      startTime: startTimeRef.current,
      endTime,
      duration,
      wasPrefetched,
      wasCached,
      timestamp: new Date(),
    };

    metrics.push(metric);

    // Keep only last MAX_METRICS
    if (metrics.length > MAX_METRICS) {
      metrics.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = duration < 100 ? '⚡' : duration < 300 ? '🚀' : '⏱️';
      console.log(
        `${emoji} Navigation to ${pathname}:`,
        Math.round(duration), 'ms',
        wasPrefetched ? '(prefetched)' : '',
        wasCached ? '(cached)' : ''
      );
    }

    // Update previous pathname
    previousPathnameRef.current = pathname;
  }, [pathname]);

  // Track navigation start
  useEffect(() => {
    startTimeRef.current = performance.now();
  }, [pathname]);

  // Log summary every 10 navigations (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics.length % 10 === 0 && metrics.length > 0) {
      logMetricsSummary();
    }
  }, [pathname]);
}

// Export metrics for external use (e.g., analytics service)
export function getNavigationMetrics() {
  return {
    metrics: [...metrics],
    summary: calculateMetrics(),
  };
}

// Reset metrics (useful for testing)
export function resetNavigationMetrics() {
  metrics.length = 0;
  prefetchedRoutes.clear();
}
