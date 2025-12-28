'use client';

import dynamic from 'next/dynamic';
import { SkeletonLoader, PageSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';

// Lazy load heavy epaper components with loading states
export const LazyPageViewer = dynamic(
  () => import('./PageViewer'),
  {
    loading: () => (
      <div className="w-full h-96 flex items-center justify-center">
        <PageSkeleton />
      </div>
    ),
    ssr: false
  }
);

export const LazyEpaperCalendarWidget = dynamic(
  () => import('./EpaperCalendarWidget').then(mod => ({ default: mod.EpaperCalendarWidget })),
  {
    loading: () => (
      <div className="w-full h-64">
        <CardSkeleton />
      </div>
    ),
    ssr: false
  }
);

export const LazyEpaperPageDisplayWidget = dynamic(
  () => import('./EpaperPageDisplayWidget').then(mod => ({ default: mod.EpaperPageDisplayWidget })),
  {
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl">
          <SkeletonLoader variant="text" width="40%" height="32px" />
          <SkeletonLoader variant="image" height="600px" />
          <div className="flex justify-center space-x-4">
            <SkeletonLoader variant="button" width="100px" />
            <SkeletonLoader variant="button" width="100px" />
            <SkeletonLoader variant="button" width="100px" />
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

export const LazyEpaperPaginationWidget = dynamic(
  () => import('./EpaperPaginationWidget').then(mod => ({ default: mod.EpaperPaginationWidget })),
  {
    loading: () => (
      <div className="flex justify-center space-x-2 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} variant="button" width="40px" height="40px" />
        ))}
      </div>
    ),
    ssr: false
  }
);

export const LazyEpaperAreaMapDisplayWidget = dynamic(
  () => import('./EpaperAreaMapDisplayWidget').then(mod => ({ default: mod.EpaperAreaMapDisplayWidget })),
  {
    loading: () => (
      <div className="relative">
        <SkeletonLoader variant="image" height="400px" />
      </div>
    ),
    ssr: false
  }
);

export const LazyEpaperClipDisplayWidget = dynamic(
  () => import('./EpaperClipDisplayWidget').then(mod => ({ default: mod.EpaperClipDisplayWidget })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    ),
    ssr: false
  }
);

// Navigation components
export const LazyNavigationWidget = dynamic(
  () => import('../navigation/NavigationWidget').then(mod => ({ default: mod.NavigationWidget })),
  {
    loading: () => (
      <div className="flex space-x-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} variant="button" width="80px" />
        ))}
      </div>
    ),
    ssr: false
  }
);

export const LazyMenuWidget = dynamic(
  () => import('../MenuWidget').then(mod => ({ default: mod.MenuWidget })),
  {
    loading: () => (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonLoader key={i} variant="text" height="40px" />
        ))}
      </div>
    ),
    ssr: false
  }
);