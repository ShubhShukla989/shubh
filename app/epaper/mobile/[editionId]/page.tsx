'use client';

import { useParams } from 'next/navigation';
import StaticEpaperLayout from '@/components/epaper/StaticEpaperLayout';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export default function MobileEpaperViewerPage() {
  const params = useParams();
  const editionId = params?.editionId as string;

  return (
    <div className="bg-gray-50" style={{ minHeight: 'auto' }}>
      <AnalyticsTracker editionId={parseInt(editionId)} />
      <StaticEpaperLayout editionId={editionId} />
    </div>
  );
}