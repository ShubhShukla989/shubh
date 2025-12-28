import React from 'react';
import dynamic from 'next/dynamic';

/**
 * Lazy load PDF viewer
 */
export const LazyPDFViewer = dynamic(
  () => import('../components/epaper/PageViewer'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Lazy load existing admin modals
 */
export const LazyEditionModal = dynamic(
  () => import('../components/admin/EditionModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export const LazyProgressModal = dynamic(
  () => import('../components/admin/ProgressModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Generic lazy loading wrapper for future components
 */
export const createLazyComponent = (importPath: string, fallbackText = 'Component not available') => {
  return dynamic(
    () => import(importPath).catch(() => ({ 
      default: () => <div className="p-4 text-gray-500">{fallbackText}</div> 
    })),
    {
      loading: () => (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ),
      ssr: false,
    }
  );
};