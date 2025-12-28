import dynamic from 'next/dynamic';
import { ComponentLoader } from '@/components/ui/LoadingSpinner';

// Custom loading components for different admin components
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8">
      <ComponentLoader text="Loading..." />
    </div>
  </div>
);

const ComponentLoader_Small = () => (
  <div className="p-4 flex items-center justify-center">
    <ComponentLoader text="Loading component..." />
  </div>
);

// Lazy load heavy admin modals and components
export const LazyEditionModal = dynamic(
  () => import('./EditionModal'),
  {
    loading: ModalLoader,
    ssr: false,
  }
);

export const LazyProgressModal = dynamic(
  () => import('./ProgressModal'),
  {
    loading: ModalLoader,
    ssr: false,
  }
);

export const LazyAreaMapTemplateManager = dynamic(
  () => import('./AreaMapTemplateManager'),
  {
    loading: ComponentLoader_Small,
    ssr: false,
  }
);

// Set display names for debugging
LazyEditionModal.displayName = 'LazyEditionModal';
LazyProgressModal.displayName = 'LazyProgressModal';
LazyAreaMapTemplateManager.displayName = 'LazyAreaMapTemplateManager';