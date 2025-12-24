'use client';

import { useState } from 'react';
import { useEpaperSafe } from '@/contexts/EpaperContext';
import PageViewer from './PageViewer';
import ShareModal from './ShareModal';

interface EpaperPageDisplayWidgetProps {
  config: {
    title?: string;
    enableNavigation?: boolean;
    enableZoom?: boolean;
    defaultZoom?: number;
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperPageDisplayWidget({ config }: EpaperPageDisplayWidgetProps) {
  const epaperContext = useEpaperSafe();
  
  // If no context (page designer mode), show preview
  if (!epaperContext) {
    return (
      <div className={`p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        <div className="bg-white rounded p-8 shadow-sm">
          <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📰</div>
              <div className="text-gray-600 font-medium">Epaper Page Display</div>
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

  const {
    editionId,
    currentPage,
    setCurrentPage,
    pages,
    zoom,
    setZoom,
    isClipping,
    setIsClipping,
    loading,
  } = epaperContext;

  const [showShareModal, setShowShareModal] = useState(false);
  const [clippedImage, setClippedImage] = useState<string | null>(null);

  // Get current page data
  const pageData = pages.find(p => p.page_number === currentPage);
  console.log('🔍 EpaperPageDisplayWidget - image_url preview:', pageData?.image_url?.substring(0, 100) + '...');

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleClipComplete = (imageData: string) => {
    setClippedImage(imageData);
    setShowShareModal(true);
    setIsClipping(false);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setClippedImage(null);
  };

  const handleClipCancel = () => {
    setIsClipping(false);
  };



  const page = pageData ? {
    number: pageData.page_number,
    imageUrl: pageData.image_url || '', // Ensure imageUrl is always a string
    id: pageData.id
  } : undefined;

  return (
    <>
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        
        <PageViewer
          page={page}
          zoom={zoom}
          isClipping={isClipping}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onClipComplete={handleClipComplete}
          onClipCancel={handleClipCancel}
          loading={loading}
          editionId={editionId}
          onPageNavigate={setCurrentPage}
        />
      </div>

      {/* Share Modal with Social Buttons Inside */}
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
