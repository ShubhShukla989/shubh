'use client';

import { useParams } from 'next/navigation';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export default function EpaperViewerPage() {
  const params = useParams();
  const editionId = params?.editionId as string;

  return (
    <div className="min-h-screen bg-gray-200">
      <AnalyticsTracker editionId={parseInt(editionId)} />
      <LayoutRenderer layoutName="Epaper Display" />
    </div>
  );
}
