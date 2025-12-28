'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { LayoutRenderer } from '@/components/layout-renderer/LayoutRenderer';

export default function AreaMapDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const areaMapId = params?.areaMapId as string;
  const editionId = searchParams?.get('editionId');
  const pageNumber = searchParams?.get('pageNumber');

  return (
    <div className="min-h-screen bg-gray-100">
      <LayoutRenderer 
        layoutName="Epaper Map"
        areaMapId={areaMapId}
        editionId={editionId || ''}
        pageNumber={pageNumber || ''}
      />
    </div>
  );
}
