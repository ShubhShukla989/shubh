'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Removed EpaperContext import - working independently now

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
  // Work independently without context
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const editionId = (params?.editionId || params?.id) as string;

  // Fetch pages independently
  useEffect(() => {
    if (editionId) {
      fetchPages();
      
      // Get initial page from URL
      const urlParams = new URLSearchParams(window.location.search);
      const pageNum = parseInt(urlParams.get('page') || '1');
      setCurrentPage(pageNum);
    }
  }, [editionId]);

  // Listen for page changes from other widgets (like EpaperPageDisplayWidget)
  useEffect(() => {
    const handlePageChange = (event: CustomEvent) => {
      setCurrentPage(event.detail.page);
    };
    
    window.addEventListener('pagechange', handlePageChange as EventListener);
    
    return () => {
      window.removeEventListener('pagechange', handlePageChange as EventListener);
    };
  }, []);

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
    // Update local state
    setCurrentPage(pageNumber);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('page', pageNumber.toString());
    window.history.replaceState({}, '', url.toString());
    
    // Notify other widgets (like EpaperPageDisplayWidget)
    window.dispatchEvent(new CustomEvent('pagechange', { 
      detail: { page: pageNumber } 
    }));
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      goToPage(newPage);
    }
  };

  const goToNext = () => {
    if (currentPage < pages.length) {
      const newPage = currentPage + 1;
      goToPage(newPage);
    }
  };

  // Show placeholder if no edition ID
  if (!editionId) {
    return (
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-3">{config.title}</h3>
        )}
        <div className="p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-center">
          <div className="text-2xl mb-2">📄</div>
          <div className="text-blue-600 font-medium">Pagination Widget</div>
          <div className="text-blue-500 text-sm mt-1">
            Page navigation will appear here
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-3">{config.title}</h3>
        )}
        <div className="text-center py-2">Loading...</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-3">{config.title}</h3>
        )}
        <div className="text-center py-2 text-gray-500">No pages available</div>
      </div>
    );
  }

  const format = config.pagerFormat || 'pagination-control';

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-3">{config.title}</h3>
      )}

      {/* Pagination Control (Full) */}
      {format === 'pagination-control' && (
        <div className="flex items-center gap-2 justify-center">
          <div className="inline-flex items-center gap-1">
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
          
          {/* PDF Download Button */}
          <button
            onClick={() => {
              if (editionId) {
                fetch(`/api/editions/${editionId}`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.success && data.data?.pdf_url) {
                      window.open(data.data.pdf_url, '_blank');
                    } else {
                      alert('PDF not available for this edition');
                    }
                  })
                  .catch(() => {
                    alert('Failed to download PDF');
                  });
              }
            }}
            className="h-6 px-2 sm:h-8 sm:px-3 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1 flex-shrink-0"
            title="Download PDF"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-xs sm:text-sm font-bold">PDF</span>
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
          
          {/* PDF Download Button */}
          <button
            onClick={() => {
              if (editionId) {
                fetch(`/api/editions/${editionId}`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.success && data.data?.pdf_url) {
                      window.open(data.data.pdf_url, '_blank');
                    } else {
                      alert('PDF not available for this edition');
                    }
                  })
                  .catch(() => {
                    alert('Failed to download PDF');
                  });
              }
            }}
            className="px-2 py-1 sm:px-3 sm:py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-xs sm:text-sm"
            title="Download PDF"
          >
            PDF
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
