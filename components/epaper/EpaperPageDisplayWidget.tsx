'use client';

import { useState } from 'react';
import { useEpaper } from '@/contexts/EpaperContext';
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
  } = useEpaper();

  const [showShareModal, setShowShareModal] = useState(false);
  const [clippedImage, setClippedImage] = useState<string | null>(null);

  // Get current page data
  const pageData = pages.find(p => p.page_number === currentPage);

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
    imageUrl: pageData.image_url || `/media/epaper/${editionId}/page-${pageData.page_number}.jpg`,
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
