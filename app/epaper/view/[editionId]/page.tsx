'use client';

import { useParams } from 'next/navigation';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';

export default function EpaperViewerPage() {
  const params = useParams();
  const editionId = params?.editionId as string;

  return (
    <div className="min-h-screen bg-gray-200">
      <LayoutRenderer layoutName="Epaper Display" />
    </div>
  );
}
