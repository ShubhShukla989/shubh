'use client';

import dynamic from 'next/dynamic';
import { SkeletonLoader, PageSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';

// Lazy load heavy epaper components with loading states
// export const LazyPageViewer = dynamic(
//   () => import('./PageViewer').then(mod => ({ default: mod.default })),
//   {
//     loading: () => (
//       <div className="w-full h-96 flex items-center justify-center">
//         <PageSkeleton />
//       </div>
//     ),
//     ssr: false
//   }
// );

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