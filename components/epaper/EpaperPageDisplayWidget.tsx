'use client';

import { useState, useEffect } from 'react';
// Removed EpaperContext import - working independently now
import LazyPageViewer from './LazyPageViewer';
import ShareModal from './ShareModal';

interface EpaperPageDisplayWidgetProps {
  config: {
    title?: string;
    width?: string | number;
    height?: string | number;
    enableNavigation?: boolean;
    enableZoom?: boolean;
    defaultZoom?: number;
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperPageDisplayWidget({ config }: EpaperPageDisplayWidgetProps) {
  // Work independently without context
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClipping, setIsClipping] = useState(false);
  
  // Get editionId from URL
  const editionId = typeof window !== 'undefined' ? 
    window.location.pathname.split('/').pop() : '';
  
  useEffect(() => {
    if (editionId) {
      fetchPages();
      
      // Get initial page from URL
      const urlParams = new URLSearchParams(window.location.search);
      const pageNum = parseInt(urlParams.get('page') || '1');
      setCurrentPage(pageNum);
    }
  }, [editionId]);

  // Listen for page changes from other widgets
  useEffect(() => {
    const handlePageChange = (event: CustomEvent) => {
      setCurrentPage(event.detail.page);
    };
    
    const handleClippingChange = (event: CustomEvent) => {
      setIsClipping(event.detail.isClipping);
      console.log('📄 EpaperPageDisplayWidget received clipping change:', event.detail.isClipping);
    };
    
    window.addEventListener('pagechange', handlePageChange as EventListener);
    window.addEventListener('clippingchange', handleClippingChange as EventListener);
    
    return () => {
      window.removeEventListener('pagechange', handlePageChange as EventListener);
      window.removeEventListener('clippingchange', handleClippingChange as EventListener);
    };
  }, []);

  // Update URL when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', currentPage.toString());
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentPage]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      console.log('📱 Fetching pages for mobile, editionId:', editionId);
      
      const response = await fetch(`/api/editions/${editionId}/pages`);
      const data = await response.json();
      
      console.log('📱 Mobile page fetch response:', data);
      
      if (data.success) {
        setPages(data.data || []);
        console.log('📱 Mobile pages loaded:', data.data?.length || 0);
      } else {
        console.error('📱 Mobile page fetch failed:', data.error);
      }
    } catch (error) {
      console.error('📱 Mobile page fetch error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get dimensions from config with mobile optimization for newspaper display
  const getWidgetDimensions = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
    // Helper function to convert number to px
    const toPx = (value: string | number | undefined) => {
      if (!value) return 'auto';
      if (typeof value === 'number') return `${value}px`;
      if (typeof value === 'string') {
        // If it's already a string with units (px, %, vh, etc.), keep as is
        if (value.match(/\d+(px|%|vh|vw|em|rem)$/)) return value;
        // If it's just a number as string, add px
        if (!isNaN(Number(value))) return `${value}px`;
        // Otherwise keep as is (could be 'auto', 'inherit', etc.)
        return value;
      }
      return 'auto';
    };
    
    let width = toPx(config.width);
    let height = toPx(config.height);
    
    // Mobile optimization: newspaper aspect ratio and responsive sizing
    if (isMobile) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate optimal newspaper size for mobile
      const maxWidth = Math.min(viewportWidth - 20, 380); // 10px margin on each side, max 380px
      const newspaperHeight = Math.floor(maxWidth * 1.4); // Newspaper aspect ratio (closer to A4)
      
      // Ensure it fits in viewport with some margin for other elements
      const maxHeight = Math.min(viewportHeight * 0.6, newspaperHeight); // Max 60% of viewport height
      
      width = `${maxWidth}px`;
      height = `${maxHeight}px`;
    } else {
      // Desktop: Apply configured dimensions with newspaper proportions
      if (config.width) {
        width = toPx(config.width);
        // Ensure minimum width on desktop
        const widthNum = parseInt(width);
        if (widthNum < 400) width = '400px';
      } else {
        width = '500px'; // Compact default desktop width
      }
      
      if (config.height) {
        height = toPx(config.height);
        // Ensure minimum height on desktop
        const heightNum = parseInt(height);
        if (heightNum < 300) height = '300px';
      } else {
        height = '700px'; // Default desktop height with newspaper ratio
      }
    }
    
    return { width, height };
  };
  
  const { width: widgetWidth, height: widgetHeight } = getWidgetDimensions();
  
  // If no editionId (page designer mode), show preview
  if (!editionId) {
    return (
      <div 
        className={`p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center ${config.cssClasses || ''}`} 
        style={{
          width: widgetWidth,
          height: widgetHeight,
          ...parseInlineStyle(config.style)
        }}
      >
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        <div className="bg-white rounded p-8 shadow-sm h-full flex flex-col">
          <div 
            className="w-full bg-gray-200 rounded flex items-center justify-center flex-1"
            style={{ minHeight: '200px' }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">📰</div>
              <div className="text-gray-600 font-medium">Epaper Page Display</div>
              <div className="text-gray-500 text-sm mt-1">
                Size: {widgetWidth} × {widgetHeight}
              </div>
              <div className="text-gray-500 text-sm mt-1">Live epaper content will appear here</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <button className="px-3 py-1 bg-gray-200 rounded">← Prev</button>
            <span>Page 1 of 12</span>
            <button className="px-3 py-1 bg-gray-200 rounded">Next →</button>
          </div>
        </div>
      </div>
    );
  }

  const [showShareModal, setShowShareModal] = useState(false);
  const [clippedImage, setClippedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Get current page data
  const pageData = pages.find(p => p.page_number === currentPage);

  // Prepare page data for LazyPageViewer
  const page = pageData ? {
    number: pageData.page_number,
    imageUrl: pageData.image_url || '',
    id: pageData.id
  } : undefined;

  // Mobile debugging
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      console.log('📱 Mobile Debug - Current state:', {
        editionId,
        currentPage,
        pagesCount: pages.length,
        pageData: pageData ? 'Found' : 'Not found',
        page: page ? 'Prepared' : 'Not prepared',
        loading,
        widgetDimensions: { widgetWidth, widgetHeight }
      });
    }
  }, [editionId, currentPage, pages.length, pageData, page, loading, widgetWidth, widgetHeight]);

  // Force re-render key based on current page and edition
  const renderKey = `${editionId}-${currentPage}-${pageData?.id || 'no-page'}`;

  // Debug effect to track page changes
  useEffect(() => {
    // Page change tracking for debugging if needed
  }, [currentPage, pageData?.id, renderKey]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      
      // Notify other widgets
      window.dispatchEvent(new CustomEvent('pagechange', { 
        detail: { page: newPage } 
      }));
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      
      // Notify other widgets
      window.dispatchEvent(new CustomEvent('pagechange', { 
        detail: { page: newPage } 
      }));
    }
  };

  const handleClipComplete = (imageData: string) => {
    setClippedImage(imageData);
    setShowShareModal(true);
    setIsClipping(false);
    
    // Notify clip widget that clipping is complete
    window.dispatchEvent(new CustomEvent('clipcomplete'));
    console.log('✅ Clip completed, notifying clip widget');
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setClippedImage(null);
  };

  const handleClipCancel = () => {
    setIsClipping(false);
    
    // Notify clip widget that clipping is cancelled
    window.dispatchEvent(new CustomEvent('clipcancel'));
    console.log('❌ Clip cancelled, notifying clip widget');
  };

  // Show loading state
  if (loading) {
    return (
      <div 
        className={config.cssClasses || ''} 
        style={{
          width: widgetWidth,
          height: widgetHeight,
          ...parseInlineStyle(config.style)
        }}
      >
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        <div className="bg-white p-8 rounded border text-center h-full flex items-center justify-center">
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading epaper pages...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show no pages message
  if (pages.length === 0) {
    return (
      <div 
        className={config.cssClasses || ''} 
        style={{
          width: widgetWidth,
          height: widgetHeight,
          ...parseInlineStyle(config.style)
        }}
      >
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-8 text-center h-full flex items-center justify-center">
          <div>
            <div className="text-4xl mb-2">📄</div>
            <p className="text-yellow-800 font-medium">No pages available</p>
            <p className="text-yellow-600 text-sm mt-1">Edition ID: {editionId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`${config.cssClasses || ''} relative bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden`}
        style={{
          width: widgetWidth,
          height: widgetHeight,
          minHeight: typeof window !== 'undefined' && window.innerWidth <= 768 ? '300px' : 'auto',
          boxSizing: 'border-box',
          minWidth: widgetWidth, // Force minimum width
          maxWidth: widgetWidth, // Force maximum width to prevent shrinking
          flexShrink: 0, // Prevent flex shrinking
          margin: typeof window !== 'undefined' && window.innerWidth <= 768 ? '0 auto' : '0', // Center on mobile
          ...parseInlineStyle(config.style)
        }}
      >
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        
        {/* Use LazyPageViewer for actual page display */}
        {page ? (
          <div 
            key={renderKey}
            style={{
              width: '100%',
              height: config.title ? 'calc(100% - 3rem)' : '100%',
              overflow: 'hidden'
            }}
          >
            <LazyPageViewer
              key={renderKey}
              page={page}
              zoom={zoom}
              isClipping={isClipping}
              onClipComplete={handleClipComplete}
              onClipCancel={handleClipCancel}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              loading={loading}
              editionId={editionId}
            />
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded p-8 text-center h-full flex items-center justify-center">
            <div>
              <div className="text-4xl mb-2">❌</div>
              <p className="text-red-800 font-medium">Page not found</p>
              <p className="text-red-600 text-sm mt-1">Page {currentPage} of {pages.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && clippedImage && (
        <ShareModal
          clippedImage={clippedImage}
          editionId={editionId}
          pageNumber={currentPage}
          onClose={handleCloseShareModal}
        />
      )}
    </>
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
