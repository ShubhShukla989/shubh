'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

export function EpaperThumbNavigationWidget({ config }: EpaperThumbNavigationWidgetProps): JSX.Element | null {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const params = useParams();
  const editionId = (params?.editionId || params?.id) as string;
  
  // Work independently without context
  const [localCurrentPage, setLocalCurrentPage] = useState<number>(1);
  
  // Ref for scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use local state for current page
  const currentPage: number = localCurrentPage;

  useEffect(() => {
    if (editionId) {
      fetchPages();
      
      // Get initial page from URL
      const urlParams = new URLSearchParams(window.location.search);
      const pageNum = parseInt(urlParams.get('page') || '1');
      setLocalCurrentPage(pageNum);
    }
  }, [editionId]);

  // Listen for page changes from other widgets (like EpaperPageDisplayWidget)
  useEffect(() => {
    const handlePageChange = (event: CustomEvent) => {
      setLocalCurrentPage(event.detail.page);
    };
    
    window.addEventListener('pagechange', handlePageChange as EventListener);
    
    return () => {
      window.removeEventListener('pagechange', handlePageChange as EventListener);
    };
  }, []);

  // Auto-scroll to center the current page when it changes (from external sources only)
  useEffect(() => {
    // Only scroll if pages are loaded and this is from external source (not direct click)
    if (pages.length > 0) {
      // Use a flag to distinguish between external changes and direct clicks
      const timeoutId = setTimeout(() => {
        scrollToPage(currentPage);
      }, 200); // Slight delay for external changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, pages.length, config.thumbWidth]);

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

  // Auto-scroll function to center the selected page
  const scrollToPage = (pageNumber: number) => {
    if (!scrollContainerRef.current || pages.length === 0) {
      return;
    }
    
    const container = scrollContainerRef.current;
    const pageIndex = pages.findIndex(p => p.page_number === pageNumber);
    
    if (pageIndex === -1) {
      return;
    }
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Get actual thumbnail element to calculate proper spacing
      const thumbnailElements = container.querySelectorAll('button');
      
      if (thumbnailElements.length === 0) {
        return;
      }
      
      const actualThumbHeight = thumbnailElements[0]?.offsetHeight || ((config.thumbWidth || 144) * (4/3));
      const actualSpacing = 12; // space-y-3 = 12px
      
      const totalItemHeight = actualThumbHeight + actualSpacing;
      const containerHeight = container.clientHeight;
      const scrollTop = (pageIndex * totalItemHeight) - (containerHeight / 2) + (actualThumbHeight / 2);
      
      // Smooth scroll to center the selected page
      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    });
  };

  const goToPage = (pageNumber: number) => {
    // Update local state first
    setLocalCurrentPage(pageNumber);
    
    // Force immediate scroll with multiple fallbacks
    const performScroll = () => {
      if (scrollContainerRef.current && pages.length > 0) {
        const container = scrollContainerRef.current;
        const pageIndex = pages.findIndex(p => p.page_number === pageNumber);
        
        if (pageIndex !== -1) {
          const thumbnailElements = container.querySelectorAll('button');
          if (thumbnailElements.length > 0) {
            const actualThumbHeight = thumbnailElements[0]?.offsetHeight || ((config.thumbWidth || 144) * (4/3));
            const actualSpacing = 12;
            const totalItemHeight = actualThumbHeight + actualSpacing;
            const containerHeight = container.clientHeight;
            const scrollTop = (pageIndex * totalItemHeight) - (containerHeight / 2) + (actualThumbHeight / 2);
            
            container.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            });
          }
        }
      }
    };
    
    // Multiple scroll attempts to ensure it works
    performScroll(); // Immediate
    setTimeout(performScroll, 50); // Quick fallback
    setTimeout(performScroll, 150); // Delayed fallback
    requestAnimationFrame(performScroll); // Next frame
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('page', pageNumber.toString());
    window.history.replaceState({}, '', url.toString());
    
    // Notify other widgets
    window.dispatchEvent(new CustomEvent('pagechange', { 
      detail: { page: pageNumber } 
    }));
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
        ref={scrollContainerRef}
        className="bg-white border border-gray-200 overflow-y-auto p-3 flex flex-col items-center"
        style={{ 
          width: `${thumbWidth}px`,
          height: boxHeight 
        }}
      >
        <div className="space-y-3 w-full flex flex-col items-center">
          {pages.map((page) => {
            const isActive = currentPage === page.page_number;
            
            return (
              <button
                key={page.id}
                onClick={() => goToPage(page.page_number)}
                className={`aspect-[3/4] rounded overflow-hidden border-2 transition-all mx-auto ${
                  isActive
                    ? 'border-red-500 ring-2 ring-red-500/50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ width: `${thumbWidth - 24}px` }} // Subtract padding
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
    const styles: React.CSSProperties = {};
    styleString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        (styles as any)[camelProperty] = value;
      }
    });
    return styles;
  } catch {
    return {};
  }
}
