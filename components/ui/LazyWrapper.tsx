'use client';

import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { SkeletonLoader } from './SkeletonLoader';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  height?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export function LazyWrapper({
  children,
  fallback,
  height = '200px',
  className = '',
  threshold = 0.1,
  rootMargin = '100px'
}: LazyWrapperProps) {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  return (
    <div ref={elementRef} className={className} style={{ minHeight: height }}>
      {isIntersecting ? (
        children
      ) : (
        fallback || <SkeletonLoader variant="card" height={height} />
      )}
    </div>
  );
}