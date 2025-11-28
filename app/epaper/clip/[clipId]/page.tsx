'use client';

import { useParams } from 'next/navigation';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';

export default function EpaperClipPage() {
  const params = useParams();
  const clipId = params?.clipId as string;

  return (
    <div className="min-h-screen bg-gray-100">
      <LayoutRenderer layoutName="Epaper Clip" />
    </div>
  );
}
