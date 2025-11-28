'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface EpaperThumbNavigationWidgetProps {
  config: {
    title?: string;
    thumbWidth?: number;
    label?: 'none' | 'page-numbers' | 'page-titles';
    boxHeight?: string;
    cssClasses?: string;
    style?: string;
  };
}

interface Page {
  id: number;
  page_number: number;
  title?: string;
  thumbnail_url?: string;
}

export function EpaperThumbNavigationWidget({ config }: EpaperThumbNavigationWidgetProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const editionId = (params?.editionId || params?.id) as string;

  useEffect(() => {
    if (editionId) {
      fetchPages();
    }
  }, [editionId]);

  useEffect(() => {
    // Get current page from URL
    const urlParams = new URLSearchParams(window.location.search);
    const pageNum = parseInt(urlParams.get('page') || '1');
    setCurrentPage(pageNum);
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages`);
      const data = await response.json();
      if (data.success && data.data) {
        // Map pages with proper image URLs
        const mappedPages = data.data.map((p: any) => ({
          ...p,
          thumbnail_url: p.image_url || `/media/epaper/${editionId}/page-${p.page_number}.jpg`
        }));
        setPages(mappedPages);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    router.push(`/epaper/view/${editionId}?page=${pageNumber}`);
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (pages.length === 0) {
    return null;
  }

  const thumbWidth = config.thumbWidth || 144; // w-36 = 144px
  const label = config.label || 'page-numbers';
  const boxHeight = config.boxHeight || '600px';

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
      )}

      <div 
        className="bg-white border border-gray-200 overflow-y-auto p-3"
        style={{ 
          width: `${thumbWidth}px`,
          height: boxHeight 
        }}
      >
        <div className="space-y-3">
          {pages.map((page) => {
            const isActive = currentPage === page.page_number;
            
            return (
              <button
                key={page.id}
                onClick={() => goToPage(page.page_number)}
                className={`w-full aspect-[3/4] rounded overflow-hidden border-2 transition-all ${
                  isActive
                    ? 'border-red-500 ring-2 ring-red-500/50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                title={`Page ${page.page_number}`}
              >
                <div className="relative w-full h-full bg-gray-100">
                  <img
                    src={page.thumbnail_url || `/media/epaper/${editionId}/page-${page.page_number}.jpg`}
                    alt={`Page ${page.page_number}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='140'%3E%3Crect fill='%234b5563' width='100' height='140'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23fff' font-size='16'%3E${page.page_number}%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                  
                  {/* Page number overlay at bottom */}
                  {label !== 'none' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                      {label === 'page-numbers' && page.page_number}
                      {label === 'page-titles' && (page.title || `Page ${page.page_number}`)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
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
