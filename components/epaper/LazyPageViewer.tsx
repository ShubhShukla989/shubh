import dynamic from 'next/dynamic';
import { ComponentLoader } from '@/components/ui/LoadingSpinner';

// Custom loading component for PageViewer
const PageViewerLoader = () => (
  <div className="w-full h-96 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <ComponentLoader text="Loading page viewer..." />
      <p className="text-sm text-gray-600 mt-2">Preparing canvas and tools...</p>
    </div>
  </div>
);

// Lazy load PageViewer - it's heavy due to canvas operations and area map interactions
const LazyPageViewer = dynamic(
  () => import('./PageViewer'),
  {
    loading: PageViewerLoader,
    ssr: false, // Canvas operations don't work with SSR
  }
);

// Set display name for debugging
LazyPageViewer.displayName = 'LazyPageViewer';

export default LazyPageViewer;