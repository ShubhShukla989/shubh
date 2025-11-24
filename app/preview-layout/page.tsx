'use client';

import { useSearchParams } from 'next/navigation';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';
import { Suspense } from 'react';

function PreviewContent() {
  const searchParams = useSearchParams();
  const layoutName = searchParams?.get('layout') || 'Site Header';

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold mb-2">Layout Preview</h1>
          <p className="text-gray-600">Previewing: {layoutName}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <LayoutRenderer layoutName={layoutName} />
        </div>
      </div>
    </div>
  );
}

export default function PreviewLayoutPage() {
  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
