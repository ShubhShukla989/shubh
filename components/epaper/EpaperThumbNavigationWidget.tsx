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
  const editionId = params?.id as string;

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
      if (data.success) {
        setPages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    router.push(`/epaper/${editionId}?page=${pageNumber}`);
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (pages.length === 0) {
    return null;
  }

  const thumbWidth = config.thumbWidth || 120;
  const label = config.label || 'page-numbers';
  const boxHeight = config.boxHeight || '120px';

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
      )}

      <div 
        className="flex gap-3 overflow-x-auto pb-3"
        style={{ height: boxHeight }}
      >
        {pages.map((page) => {
          const isActive = currentPage === page.page_number;
          
          return (
            <div
              key={page.id}
              onClick={() => goToPage(page.page_number)}
              className={`flex-shrink-0 cursor-pointer transition-all ${
                isActive 
                  ? 'ring-4 ring-blue-500 scale-105' 
                  : 'hover:ring-2 hover:ring-blue-300'
              }`}
              style={{ width: thumbWidth }}
            >
              {/* Thumbnail */}
              <div 
                className="relative bg-gray-200 rounded overflow-hidden shadow-md"
                style={{ 
                  width: thumbWidth,
                  height: thumbWidth * 1.4, // Maintain aspect ratio
                }}
              >
                {page.thumbnail_url ? (
                  <Image
                    src={page.thumbnail_url}
                    alt={`Page ${page.page_number}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Label */}
              {label !== 'none' && (
                <div className="mt-1 text-center text-sm font-medium">
                  {label === 'page-numbers' && (
                    <span className={isActive ? 'text-blue-600' : 'text-gray-700'}>
                      {page.page_number}
                    </span>
                  )}
                  {label === 'page-titles' && (
                    <span className={isActive ? 'text-blue-600' : 'text-gray-700'}>
                      {page.title || `Page ${page.page_number}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
