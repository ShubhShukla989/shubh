'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface EpaperDisplayWidgetProps {
  config: {
    title?: string;
    cssClasses?: string;
    style?: string;
  };
}

interface Page {
  id: number;
  page_number: number;
  image_url: string;
  title?: string;
}

interface AreaMap {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url?: string;
}

export function EpaperDisplayWidget({ config }: EpaperDisplayWidgetProps) {
  const [page, setPage] = useState<Page | null>(null);
  const [areaMaps, setAreaMaps] = useState<AreaMap[]>([]);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const editionId = params?.id as string;

  useEffect(() => {
    if (editionId) {
      fetchCurrentPage();
    }
  }, [editionId]);

  const fetchCurrentPage = async () => {
    try {
      // Get page number from URL
      const urlParams = new URLSearchParams(window.location.search);
      const pageNum = parseInt(urlParams.get('page') || '1');

      // Fetch pages
      const pagesResponse = await fetch(`/api/editions/${editionId}/pages`);
      const pagesData = await pagesResponse.json();
      
      if (pagesData.success) {
        const pages = pagesData.data || [];
        const currentPage = pages.find((p: Page) => p.page_number === pageNum) || pages[0];
        setPage(currentPage);

        // Fetch area maps for this page
        if (currentPage?.id) {
          const areaMapsResponse = await fetch(`/api/editions/${editionId}/pages/${currentPage.id}/area-maps`);
          const areaMapsData = await areaMapsResponse.json();
          if (areaMapsData.success) {
            setAreaMaps(areaMapsData.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleAreaClick = (areaMap: AreaMap) => {
    if (areaMap.url) {
      window.open(areaMap.url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading epaper...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">No page found</p>
      </div>
    );
  }

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h2 className="text-2xl font-bold mb-4">{config.title}</h2>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={handleZoomOut}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          disabled={zoom <= 50}
        >
          −
        </button>
        <span className="text-sm font-medium min-w-[60px] text-center">
          {zoom}%
        </span>
        <button
          onClick={handleZoomIn}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          disabled={zoom >= 200}
        >
          +
        </button>
      </div>

      {/* Page Display */}
      <div className="relative overflow-auto bg-gray-100 rounded-lg shadow-lg">
        <div 
          className="relative mx-auto"
          style={{
            width: `${zoom}%`,
            maxWidth: '100%',
          }}
        >
          {/* Page Image */}
          <div className="relative w-full" style={{ aspectRatio: '1/1.4' }}>
            <Image
              src={page.image_url}
              alt={`Page ${page.page_number}`}
              fill
              className="object-contain"
              priority
            />

            {/* Area Maps Overlay */}
            {areaMaps.map((areaMap) => (
              <div
                key={areaMap.id}
                onClick={() => handleAreaClick(areaMap)}
                className="absolute border-2 border-blue-500 bg-blue-500/10 hover:bg-blue-500/30 cursor-pointer transition-colors group"
                style={{
                  left: `${areaMap.x}%`,
                  top: `${areaMap.y}%`,
                  width: `${areaMap.width}%`,
                  height: `${areaMap.height}%`,
                }}
                title={areaMap.title}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {areaMap.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page Info */}
      {page.title && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">{page.title}</p>
        </div>
      )}
    </div>
  );
}

function parseInlineStyle(styleString?: string): React.CSSProperties {
  if (!styleString) return {};
  
  try {
    const styles: any = {};
    styleString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelProperty] = value;
      }
    });
    return styles;
  } catch {
    return {};
  }
}
