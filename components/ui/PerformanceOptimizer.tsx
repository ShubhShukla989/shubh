'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { SkeletonLoader } from './SkeletonLoader';

interface PerformanceOptimizerProps {
  children: ReactNode;
  priority?: 'high' | 'medium' | 'low';
  fallback?: ReactNode;
  height?: string;
  className?: string;
  preload?: boolean;
}

export function PerformanceOptimizer({
  children,
  priority = 'medium',
  fallback,
  height = '200px',
  className = '',
  preload = false
}: PerformanceOptimizerProps) {
  const [shouldRender, setShouldRender] = useState(priority === 'high' || preload);
  
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: priority === 'high' ? '200px' : priority === 'medium' ? '100px' : '50px',
    triggerOnce: true
  });

  useEffect(() => {
    if (isIntersecting || priority === 'high') {
      setShouldRender(true);
    }
  }, [isIntersecting, priority]);

  return (
    <div ref={elementRef} className={className} style={{ minHeight: height }}>
      {shouldRender ? (
        children
      ) : (
        fallback || <SkeletonLoader variant="card" height={height} />
      )}
    </div>
  );
}

// Specific optimizers for common use cases
export function OptimizedWidget({ 
  children, 
  type, 
  priority = 'medium' 
}: { 
  children: ReactNode; 
  type: string; 
  priority?: 'high' | 'medium' | 'low';
}) {
  const skeletonMap = {
    'epaper-page-display': () => (
      <div className="space-y-4">
        <SkeletonLoader variant="text" width="40%" height="32px" />
        <SkeletonLoader variant="image" height="600px" />
      </div>
    ),
    'epaper-pagination': () => (
      <div className="flex justify-center space-x-2 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} variant="button" width="40px" height="40px" />
        ))}
      </div>
    ),
    'navigation': () => (
      <div className="flex space-x-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} variant="button" width="80px" />
        ))}
      </div>
    ),
    default: () => <SkeletonLoader variant="card" height="200px" />
  };

  const SkeletonComponent = skeletonMap[type as keyof typeof skeletonMap] || skeletonMap.default;

  return (
    <PerformanceOptimizer
      priority={priority}
      fallback={<SkeletonComponent />}
    >
      {children}
    </PerformanceOptimizer>
  );
}