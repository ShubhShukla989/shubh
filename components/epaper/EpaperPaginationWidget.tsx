'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface EpaperPaginationWidgetProps {
  config: {
    title?: string;
    pagerFormat?: 'pagination-control' | 'pagination-control-mini' | 'dropdown-list-page-numbers' | 'dropdown-list-page-titles';
    cssClasses?: string;
    style?: string;
  };
}

interface Page {
  id: number;
  page_number: number;
  title?: string;
}

export function EpaperPaginationWidget({ config }: EpaperPaginationWidgetProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const editionId = (params?.editionId || params?.id) as string;

  console.log('EpaperPaginationWidget rendered', { editionId, config, params });

  useEffect(() => {
    if (editionId) {
      fetchPages();
    }
  }, [editionId]);

  const fetchPages = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages`);
      const data = await response.json();
      if (data.success) {
        setPages(data.data || []);
        // Get current page from URL or default to 1
        const urlParams = new URLSearchParams(window.location.search);
        const pageNum = parseInt(urlParams.get('page') || '1');
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    const page = pages.find(p => p.page_number === pageNumber);
    if (page) {
      router.push(`/epaper/view/${editionId}?page=${pageNumber}`);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < pages.length) {
      goToPage(currentPage + 1);
    }
  };

  if (loading) {
    return <div className="text-center py-2">Loading...</div>;
  }

  if (pages.length === 0) {
    return null;
  }

  const format = config.pagerFormat || 'pagination-control';

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-3">{config.title}</h3>
      )}

      {/* Pagination Control (Full) */}
      {format === 'pagination-control' && (
        <div className="inline-flex items-center gap-1 justify-center">
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="h-6 px-2 sm:h-8 sm:px-3 flex items-center justify-center bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <span className="text-sm sm:text-base font-bold" style={{ lineHeight: '1' }}>‹‹</span>
          </button>
          
          {/* Current page / Total pages */}
          <div className="h-6 px-2 sm:h-8 sm:px-3 bg-gray-100 rounded text-sm sm:text-base font-bold text-gray-800 whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center" style={{ lineHeight: '1', fontFamily: 'monospace' }}>
            {currentPage}/{pages.length}
          </div>
          
          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={currentPage === pages.length}
            className="h-6 px-2 sm:h-8 sm:px-3 flex items-center justify-center bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <span className="text-sm sm:text-base font-bold" style={{ lineHeight: '1' }}>››</span>
          </button>
        </div>
      )}

      {/* Pagination Control (Mini) */}
      {format === 'pagination-control-mini' && (
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            &lt;&lt;
          </button>
          
          <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 rounded text-xs sm:text-sm font-medium">
            {currentPage} / {pages.length}
          </span>
          
          <button
            onClick={goToNext}
            disabled={currentPage === pages.length}
            className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            &gt;&gt;
          </button>
        </div>
      )}

      {/* Dropdown List (Page Numbers) */}
      {format === 'dropdown-list-page-numbers' && (
        <select
          value={currentPage}
          onChange={(e) => goToPage(parseInt(e.target.value))}
          className="w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base"
        >
          {pages.map((page) => (
            <option key={page.id} value={page.page_number}>
              Page {page.page_number}
            </option>
          ))}
        </select>
      )}

      {/* Dropdown List (Page Titles) */}
      {format === 'dropdown-list-page-titles' && (
        <select
          value={currentPage}
          onChange={(e) => goToPage(parseInt(e.target.value))}
          className="w-full sm:w-auto px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-base"
        >
          {pages.map((page) => (
            <option key={page.id} value={page.page_number}>
              {page.title || `Page ${page.page_number}`}
            </option>
          ))}
        </select>
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
