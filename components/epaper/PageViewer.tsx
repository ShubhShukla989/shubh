'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PDFThumbnail from '@/components/PDFThumbnail';

interface Page {
  number: number;
  imageUrl: string;
  id?: number;
}

interface AreaMap {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url: string;
}

interface PageViewerProps {
  page?: Page;
  zoom: number;
  isClipping: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onClipComplete: (imageData: string) => void;
  onClipCancel: () => void;
  loading: boolean;
  editionId?: string;
}

export default function PageViewer({
  page,
  zoom,
  isClipping,
  onPrevPage,
  onNextPage,
  onClipComplete,
  onClipCancel,
  loading,
  editionId
}: PageViewerProps) {
  const [clipStart, setClipStart] = useState<{ x: number; y: number } | null>(null);
  const [clipEnd, setClipEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [areaMaps, setAreaMaps] = useState<AreaMap[]>([]);
  const [hoveredArea, setHoveredArea] = useState<AreaMap | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaMap | null>(null);
  const [imageScale, setImageScale] = useState(1);

  const [editionData, setEditionData] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isClipping) {
      setClipStart(null);
      setClipEnd(null);
    }
  }, [isClipping]);

  useEffect(() => {
    if (page?.id && editionId) {
      fetchAreaMaps();
      fetchEditionData();
    }
  }, [page?.id, editionId]);

  const fetchAreaMaps = async () => {
    if (!page?.id || !editionId) return;
    
    try {
      const response = await fetch(`/api/editions/${editionId}/pages/${page.id}/area-maps`);
      const result = await response.json();
      if (result.success) {
        setAreaMaps(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch area maps:', error);
    }
  };

  const fetchEditionData = async () => {
    if (!editionId) return;
    
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const result = await response.json();
      if (result.success) {
        setEditionData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch edition data:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isClipping || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setClipStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isClipping || !isDragging || !clipStart || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setClipEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseUp = () => {
    if (!isClipping || !clipStart || !clipEnd) return;
    
    setIsDragging(false);
    createClip();
  };

  const handleAreaClick = async (e: React.MouseEvent, area: AreaMap) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedArea(area);
    
    // Directly create clip and show share modal
    const imageData = await createClipFromArea(area);
    if (imageData) {
      onClipComplete(imageData);
    }
  };

  const createClipFromArea = async (area: AreaMap) => {
    if (!imageRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = imageRef.current;
    
    // Calculate actual pixel coordinates from area coordinates
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Area coordinates are already in natural image coordinates
    const sourceX = area.x;
    const sourceY = area.y;
    const sourceWidth = area.width;
    const sourceHeight = area.height;

    const headerHeight = 200;
    
    // Set canvas size to match the clipped area + header
    canvas.width = sourceWidth;
    canvas.height = sourceHeight + headerHeight;

    // Draw header background (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sourceWidth, headerHeight);

    // Try to load and draw logo from media manager
    let logoLoaded = false;
    try {
      // Fetch all media files to find logo
      const mediaResponse = await fetch('/api/media');
      const mediaData = await mediaResponse.json();
      
      if (mediaData.success && mediaData.data && Array.isArray(mediaData.data)) {
        // Find the logo file (check title or name)
        const logoFile = mediaData.data.find((file: any) => {
          const title = file.title?.toLowerCase() || '';
          const name = file.name?.toLowerCase() || '';
          const altText = file.alt_text?.toLowerCase() || '';
          return title === 'logo' || name.includes('logo') || altText === 'logo';
        });
        
        if (logoFile?.url) {
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.error('Logo load timeout');
              resolve();
            }, 3000);
            
            logo.onload = () => {
              clearTimeout(timeout);
              // Draw logo centered at top, taking 70% of header height
              const logoHeight = headerHeight * 0.65;
              const logoWidth = (logo.width / logo.height) * logoHeight;
              const logoX = (sourceWidth - logoWidth) / 2;
              const logoY = 10;
              ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
              logoLoaded = true;
              resolve();
            };
            logo.onerror = (err) => {
              clearTimeout(timeout);
              console.error('Logo load error:', err);
              resolve(); // Continue even if logo fails
            };
            logo.src = logoFile.url;
          });
        } else {
          console.warn('No logo file found in media');
        }
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
    }

    // Draw text info in center below logo
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    const centerX = sourceWidth / 2;

    // Draw dynamic URL (current page URL)
    ctx.font = '16px Arial';
    const currentUrl = `${window.location.origin}/epaper/view/${editionId}`;
    ctx.fillText(currentUrl, centerX, headerHeight - 45);

    // Draw date and page number in one line
    if (editionData?.date) {
      ctx.font = '14px Arial';
      const date = new Date(editionData.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const datePageText = `${date} - Page ${page?.number}`;
      ctx.fillText(datePageText, centerX, headerHeight - 20);
    } else {
      ctx.font = '14px Arial';
      ctx.fillText(`Page ${page?.number}`, centerX, headerHeight - 20);
    }

    // Reset text align
    ctx.textAlign = 'left';

    // Draw ONLY the selected area below header
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle (what to clip)
      0, headerHeight, sourceWidth, sourceHeight     // Destination rectangle (where to draw)
    );

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    return dataUrl;
  };



  const createClip = async () => {
    if (!clipStart || !clipEnd || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const x = Math.min(clipStart.x, clipEnd.x) * scaleX;
    const y = Math.min(clipStart.y, clipEnd.y) * scaleY;
    const width = Math.abs(clipEnd.x - clipStart.x) * scaleX;
    const height = Math.abs(clipEnd.y - clipStart.y) * scaleY;

    const headerHeight = 200;
    canvas.width = width;
    canvas.height = height + headerHeight;

    // Draw header background (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, headerHeight);

    // Try to load and draw logo from media manager
    let logoLoaded = false;
    try {
      // Fetch all media files to find logo
      const mediaResponse = await fetch('/api/media');
      const mediaData = await mediaResponse.json();
      
      if (mediaData.success && mediaData.data && Array.isArray(mediaData.data)) {
        // Find the logo file (check title or name)
        const logoFile = mediaData.data.find((file: any) => {
          const title = file.title?.toLowerCase() || '';
          const name = file.name?.toLowerCase() || '';
          const altText = file.alt_text?.toLowerCase() || '';
          return title === 'logo' || name.includes('logo') || altText === 'logo';
        });
        
        if (logoFile?.url) {
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.error('Logo load timeout');
              resolve();
            }, 3000);
            
            logo.onload = () => {
              clearTimeout(timeout);
              // Draw logo centered at top, taking 70% of header height
              const logoHeight = headerHeight * 0.65;
              const logoWidth = (logo.width / logo.height) * logoHeight;
              const logoX = (width - logoWidth) / 2;
              const logoY = 10;
              ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
              logoLoaded = true;
              resolve();
            };
            logo.onerror = (err) => {
              clearTimeout(timeout);
              console.error('Logo load error:', err);
              resolve(); // Continue even if logo fails
            };
            logo.src = logoFile.url;
          });
        } else {
          console.warn('No logo file found in media');
        }
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
    }

    // Draw text info in center below logo
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    const centerX = width / 2;

    // Draw dynamic URL (current page URL)
    ctx.font = '16px Arial';
    const currentUrl = `${window.location.origin}/epaper/view/${editionId}`;
    ctx.fillText(currentUrl, centerX, headerHeight - 45);

    // Draw date and page number in one line
    if (editionData?.date) {
      ctx.font = '14px Arial';
      const date = new Date(editionData.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const datePageText = `${date} - Page ${page?.number}`;
      ctx.fillText(datePageText, centerX, headerHeight - 20);
    } else {
      ctx.font = '14px Arial';
      ctx.fillText(`Page ${page?.number}`, centerX, headerHeight - 20);
    }

    // Reset text align
    ctx.textAlign = 'left';

    // Draw clipped portion below header
    ctx.drawImage(img, x, y, width, height, 0, headerHeight, width, height);

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    onClipComplete(dataUrl);
  };

  const clipRect = clipStart && clipEnd ? {
    left: Math.min(clipStart.x, clipEnd.x),
    top: Math.min(clipStart.y, clipEnd.y),
    width: Math.abs(clipEnd.x - clipStart.x),
    height: Math.abs(clipEnd.y - clipStart.y)
  } : null;

  return (
    <div className="flex-1 flex items-center justify-center bg-white relative overflow-auto p-1 md:p-2">
      {/* Navigation Buttons - Responsive */}
      <button
        onClick={onPrevPage}
        className="absolute left-1 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg transition-all z-10"
        title="Previous Page (←)"
      >
        <ChevronLeft className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
      </button>

      <button
        onClick={onNextPage}
        className="absolute right-1 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg transition-all z-10"
        title="Next Page (→)"
      >
        <ChevronRight className="w-4 h-4 md:w-6 md:h-6 text-gray-900" />
      </button>

      {/* Clipping Mode Indicator - Responsive */}
      {isClipping && (
        <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg shadow-lg z-20 flex items-center gap-2 md:gap-3">
          <span className="font-medium text-xs md:text-base">Click and drag to select area</span>
          <button
            onClick={onClipCancel}
            className="p-1 hover:bg-blue-700 rounded"
          >
            <X className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      )}

      {/* Page Container */}
      <div
        ref={containerRef}
        className={`relative bg-white shadow-2xl ${isClipping ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
        style={{
          transform: `scale(${zoom})`,
          transition: 'transform 0.2s ease-out',
          transformOrigin: 'center center'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
      >
        {loading ? (
          <div className="w-[800px] h-[1100px] flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading page...</p>
            </div>
          </div>
        ) : page ? (
          <>
            {page.imageUrl?.endsWith('.pdf') ? (
              <div className="relative" style={{ maxWidth: '900px' }}>
                <iframe
                  ref={imageRef as any}
                  src={`${page.imageUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full border-0 select-none"
                  style={{ height: '1200px', pointerEvents: 'none' }}
                  onLoad={() => {
                    setImageScale(1);
                  }}
                />
              </div>
            ) : (
              <div className="w-full md:w-auto" style={{ maxWidth: '900px' }}>
                <img
                  ref={imageRef}
                  src={page.imageUrl}
                  alt={`Page ${page.number}`}
                  className="h-auto select-none w-full"
                  draggable={false}
                  crossOrigin="anonymous"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    setImageScale(img.clientWidth / img.naturalWidth);
                  }}
                  onError={(e) => {
                    // Fallback placeholder
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1100'%3E%3Crect fill='%23f3f4f6' width='800' height='1100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%239ca3af' font-size='24' font-family='Arial'%3EPage ${page.number}%3C/text%3E%3C/svg%3E`;
                  }}
                />
              </div>
            )}
            
            {/* Area Maps - Interactive Regions */}
            {!isClipping && areaMaps.map((area) => (
              <div
                key={area.id}
                className="absolute transition-all duration-200"
                style={{
                  left: `${area.x * imageScale}px`,
                  top: `${area.y * imageScale}px`,
                  width: `${area.width * imageScale}px`,
                  height: `${area.height * imageScale}px`,
                  border: hoveredArea?.id === area.id 
                    ? '3px solid #ef4444' 
                    : '3px solid transparent',
                  backgroundColor: hoveredArea?.id === area.id 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredArea(area)}
                onMouseLeave={() => setHoveredArea(null)}
                onClick={(e) => handleAreaClick(e, area)}
                title={area.title}
              />
            ))}
          </>
        ) : null}

        {/* Clipping Rectangle */}
        {clipRect && (
          <>
            <div
              className="absolute border-4 border-blue-500 bg-blue-500/20 pointer-events-none"
              style={{
                left: clipRect.left,
                top: clipRect.top,
                width: clipRect.width,
                height: clipRect.height
              }}
            />
            {/* Share and Cancel buttons outside the rectangle */}
            <div 
              className="absolute flex gap-2 z-30"
              style={{
                left: clipRect.left,
                top: clipRect.top + clipRect.height + 10
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  createClip();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded shadow-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClipCancel();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded shadow-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hidden Canvas for Clipping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
