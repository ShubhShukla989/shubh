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
        <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
      )}

      {/* Pagination Control (Full) */}
      {format === 'pagination-control' && (
        <div className="inline-flex items-center gap-1">
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">&#9664;&#9664;</span>
          </button>
          
          {/* Page numbers - Smart pagination (max 5 pages) */}
          {(() => {
            const totalPages = pages.length;
            const maxVisible = 5;
            let startPage = 1;
            let endPage = totalPages;

            if (totalPages > maxVisible) {
              // Calculate range to keep current page in center
              const halfVisible = Math.floor(maxVisible / 2);
              startPage = Math.max(1, currentPage - halfVisible);
              endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              // Adjust if we're near the end
              if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }
            }

            return pages
              .filter(p => p.page_number >= startPage && p.page_number <= endPage)
              .map((page) => (
                <button
                  key={page.id}
                  onClick={() => goToPage(page.page_number)}
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors text-base font-semibold ${
                    currentPage === page.page_number
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page.page_number}
                </button>
              ));
          })()}
          
          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={currentPage === pages.length}
            className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-lg">&#9654;&#9654;</span>
          </button>
        </div>
      )}

      {/* Pagination Control (Mini) */}
      {format === 'pagination-control-mini' && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            &lt;&lt;
          </button>
          
          <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
            {currentPage} / {pages.length}
          </span>
          
          <button
            onClick={goToNext}
            disabled={currentPage === pages.length}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
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
          className="w-auto px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-auto px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
