'use client';

import { useParams } from 'next/navigation';
import { EpaperProvider } from '@/contexts/EpaperContext';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';

export default function EpaperViewerPage() {
  const params = useParams();
  const editionId = params?.editionId as string;

  return (
    <EpaperProvider editionId={editionId}>
      <div className="min-h-screen bg-gray-200">
        <LayoutRenderer layoutName="Epaper Display" />
      </div>
    </EpaperProvider>
  );
}
