'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PDFThumbnail from '@/components/PDFThumbnail';
import ResizeHandle from '@/components/admin/ResizeHandle';
import { EpaperAreaMapDisplayWidget } from './EpaperAreaMapDisplayWidget';
import { SocialWidget } from '../SocialWidget';
import { OptimizedImage, PageImage } from '@/components/ui/OptimizedImage';
import { ProgressiveImage } from '@/components/ui/ProgressiveImage';
import { getEpaperImageSizes } from '@/lib/image-utils';

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
  linked_area_ids?: number[];
  linked_page_number?: number;
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
  onPageNavigate?: (pageNumber: number) => void;
  containerWidth?: string;
  containerHeight?: string;
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
  editionId,
  onPageNavigate,
  containerWidth = 'auto',
  containerHeight = 'auto'
}: PageViewerProps) {
  const [clipStart, setClipStart] = useState<{ x: number; y: number } | null>(null);
  const [clipEnd, setClipEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingClip, setIsMovingClip] = useState(false);
  const clipMoveStateRef = useRef<{
    startX: number;
    startY: number;
    originalStart: { x: number; y: number } | null;
    originalEnd: { x: number; y: number } | null;
  }>({
    startX: 0,
    startY: 0,
    originalStart: null,
    originalEnd: null
  });
  const [isResizingClip, setIsResizingClip] = useState(false);
  const [clipResizeHandle, setClipResizeHandle] = useState<string | null>(null);
  const [clipResizeStart, setClipResizeStart] = useState<{ x: number; y: number; rect: any } | null>(null);
  const [areaMaps, setAreaMaps] = useState<AreaMap[]>([]);
  const [hoveredArea, setHoveredArea] = useState<AreaMap | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaMap | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);
  const [zoomModalTitle, setZoomModalTitle] = useState<string>('');
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 }); // Percentage
  
  // Area Map Modal State
  const [showAreaMapModal, setShowAreaMapModal] = useState(false);
  const [selectedAreaMapId, setSelectedAreaMapId] = useState<number | null>(null);

  const [editionData, setEditionData] = useState<any>(null);
  const [logoCache, setLogoCache] = useState<string | null>(null);
  const [mediaCache, setMediaCache] = useState<any>(null);
  const [categoryLogoUrl, setCategoryLogoUrl] = useState<string | null>(null);
  const [watermarkSettings, setWatermarkSettings] = useState<any>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isClipping) {
      setClipStart(null);
      setClipEnd(null);
    } else {
      // When clipping mode is enabled, create a clip box in the center
      handleCreateClipBox();
    }
  }, [isClipping]);
  
  // Create a clip box in the center when clipping mode starts
  const handleCreateClipBox = () => {
    if (!containerRef.current || !imageRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();
    
    // Better responsive box size for mobile
    const isMobile = window.innerWidth <= 768;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let defaultWidth, defaultHeight;
    
    if (isMobile) {
      // Mobile: Use percentage of image size with better constraints
      defaultWidth = Math.min(
        viewportWidth * 0.7,  // 70% of viewport width
        imgRect.width * 0.8,  // 80% of image width
        300  // Max 300px
      );
      defaultHeight = Math.min(
        viewportHeight * 0.4,  // 40% of viewport height
        imgRect.height * 0.6,  // 60% of image height
        400  // Max 400px
      );
    } else {
      // Desktop: Original sizes
      defaultWidth = 600;
      defaultHeight = 400;
    }
    
    // Calculate center position relative to image
    const centerX = Math.max(0, (imgRect.width - defaultWidth) / 2);
    const centerY = Math.max(0, (imgRect.height - defaultHeight) / 2);
    
    setClipStart({ x: centerX, y: centerY });
    setClipEnd({ x: centerX + defaultWidth, y: centerY + defaultHeight });
  };

  // Removed problematic useEffect that was causing infinite loop

  // Handle moving the clip box
  const handleClipMoveStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!clipStart || !clipEnd) return;
    e.stopPropagation();
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    clipMoveStateRef.current = {
      startX: clientX,
      startY: clientY,
      originalStart: { ...clipStart },
      originalEnd: { ...clipEnd }
    };
    
    setIsMovingClip(true);
    
    // Add global mouse/touch move and up listeners with passive: false for better mobile performance
    document.addEventListener('mousemove', handleClipMoveMove, { passive: false });
    document.addEventListener('mouseup', handleClipMoveEnd, { passive: false });
    document.addEventListener('touchmove', handleClipMoveTouchMove, { passive: false });
    document.addEventListener('touchend', handleClipMoveEnd, { passive: false });
  };

  const handleClipMoveMove = (e: MouseEvent) => {
    const state = clipMoveStateRef.current;
    if (!state.originalStart || !state.originalEnd) return;
    
    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    
    setClipStart({
      x: state.originalStart.x + deltaX,
      y: state.originalStart.y + deltaY
    });
    setClipEnd({
      x: state.originalEnd.x + deltaX,
      y: state.originalEnd.y + deltaY
    });
  };

  const handleClipMoveTouchMove = (e: TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while dragging
    const state = clipMoveStateRef.current;
    if (!state.originalStart || !state.originalEnd) return;
    
    const deltaX = e.touches[0].clientX - state.startX;
    const deltaY = e.touches[0].clientY - state.startY;
    
    setClipStart({
      x: state.originalStart.x + deltaX,
      y: state.originalStart.y + deltaY
    });
    setClipEnd({
      x: state.originalEnd.x + deltaX,
      y: state.originalEnd.y + deltaY
    });
  };

  const handleClipMoveEnd = () => {
    clipMoveStateRef.current = {
      startX: 0,
      startY: 0,
      originalStart: null,
      originalEnd: null
    };
    
    setIsMovingClip(false);
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleClipMoveMove);
    document.removeEventListener('mouseup', handleClipMoveEnd);
    document.removeEventListener('touchmove', handleClipMoveTouchMove);
    document.removeEventListener('touchend', handleClipMoveEnd);
  };

  const handleAreaClick = async (e: React.MouseEvent, area: AreaMap) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Area clicked!', {
      areaId: area.id,
      title: area.title,
      position: { x: area.x, y: area.y },
      size: { width: area.width, height: area.height },
      linkedAreas: area.linked_area_ids
    });
    
    // Open area map modal
    console.log('🔍 Opening area map modal for area ID:', area.id);
    setSelectedAreaMapId(area.id);
    setShowAreaMapModal(true);
    
    console.log('📱 Modal state updated:', {
      showAreaMapModal: true,
      selectedAreaMapId: area.id
    });
  };
  
  const handleCloseAreaMapModal = () => {
    setShowAreaMapModal(false);
    setSelectedAreaMapId(null);
  };

  // Clip resize handlers - Using refs to avoid closure issues (copied from area-maps)
  const clipResizeStateRef = useRef<{
    handle: string | null;
    startX: number;
    startY: number;
    originalStart: { x: number; y: number } | null;
    originalEnd: { x: number; y: number } | null;
  }>({
    handle: null,
    startX: 0,
    startY: 0,
    originalStart: null,
    originalEnd: null
  });

  const handleClipResizeStart = (e: React.MouseEvent | React.TouchEvent, handle: string) => {
    if (!clipStart || !clipEnd) {
      console.log('❌ No clip coordinates found');
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🔧 Clip resize handle clicked:', handle);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    clipResizeStateRef.current = {
      handle,
      startX: clientX,
      startY: clientY,
      originalStart: { ...clipStart },
      originalEnd: { ...clipEnd }
    };
    
    setIsResizingClip(true);
    setClipResizeHandle(handle);
    
    // Add global mouse/touch move and up listeners
    document.addEventListener('mousemove', handleClipResizeMove);
    document.addEventListener('mouseup', handleClipResizeEnd);
    document.addEventListener('touchmove', handleClipResizeTouchMove);
    document.addEventListener('touchend', handleClipResizeEnd);
  };

  const handleClipResizeTouchMove = (e: TouchEvent) => {
    const state = clipResizeStateRef.current;
    if (!state.handle || !state.originalStart || !state.originalEnd) return;
    
    const deltaX = e.touches[0].clientX - state.startX;
    const deltaY = e.touches[0].clientY - state.startY;
    
    applyClipResize(deltaX, deltaY, state);
  };

  const handleClipResizeMove = (e: MouseEvent) => {
    const state = clipResizeStateRef.current;
    if (!state.handle || !state.originalStart || !state.originalEnd) return;
    
    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    
    applyClipResize(deltaX, deltaY, state);
  };

  const applyClipResize = (deltaX: number, deltaY: number, state: typeof clipResizeStateRef.current) => {
    if (!state.handle || !state.originalStart || !state.originalEnd) return;
    
    // Calculate current rect from original coordinates
    const origLeft = Math.min(state.originalStart.x, state.originalEnd.x);
    const origTop = Math.min(state.originalStart.y, state.originalEnd.y);
    const origWidth = Math.abs(state.originalEnd.x - state.originalStart.x);
    const origHeight = Math.abs(state.originalEnd.y - state.originalStart.y);
    
    let newLeft = origLeft;
    let newTop = origTop;
    let newWidth = origWidth;
    let newHeight = origHeight;
    
    // Apply resize based on handle
    switch (state.handle) {
      case 'top-left':
        newLeft += deltaX;
        newTop += deltaY;
        newWidth -= deltaX;
        newHeight -= deltaY;
        break;
      case 'top':
        newTop += deltaY;
        newHeight -= deltaY;
        break;
      case 'top-right':
        newWidth += deltaX;
        newTop += deltaY;
        newHeight -= deltaY;
        break;
      case 'left':
        newLeft += deltaX;
        newWidth -= deltaX;
        break;
      case 'right':
        newWidth += deltaX;
        break;
      case 'bottom-left':
        newLeft += deltaX;
        newWidth -= deltaX;
        newHeight += deltaY;
        break;
      case 'bottom':
        newHeight += deltaY;
        break;
      case 'bottom-right':
        newWidth += deltaX;
        newHeight += deltaY;
        break;
    }
    
    // Enforce minimum size
    const minSize = 50;
    if (newWidth < minSize) {
      if (state.handle.includes('left')) {
        newLeft = origLeft + origWidth - minSize;
      }
      newWidth = minSize;
    }
    if (newHeight < minSize) {
      if (state.handle.includes('top')) {
        newTop = origTop + origHeight - minSize;
      }
      newHeight = minSize;
    }
    
    // Update clip coordinates
    setClipStart({ x: newLeft, y: newTop });
    setClipEnd({ x: newLeft + newWidth, y: newTop + newHeight });
  };

  const handleClipResizeEnd = () => {
    console.log('✅ Clip resize ended');
    
    clipResizeStateRef.current = {
      handle: null,
      startX: 0,
      startY: 0,
      originalStart: null,
      originalEnd: null
    };
    
    setIsResizingClip(false);
    setClipResizeHandle(null);
    setClipResizeStart(null);
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleClipResizeMove);
    document.removeEventListener('mouseup', handleClipResizeEnd);
    document.removeEventListener('touchmove', handleClipResizeTouchMove);
    document.removeEventListener('touchend', handleClipResizeEnd);
  };

  const createCombinedClipFromLinkedAreas = async (mainArea: AreaMap) => {
    if (!canvasRef.current) return null;

    try {
      console.time('⚡ Simplified combined clip generation');
      
      // Fetch all linked area maps IN PARALLEL
      const linkedIds = mainArea.linked_area_ids || [];
      
      // Parallel fetch with Promise.all for speed
      const linkedAreas = await Promise.all(
        linkedIds.map(async (areaId) => {
          try {
            const response = await fetch(`/api/editions/${editionId}/area-maps/${areaId}`);
            const result = await response.json();
            return result.success ? result.data : null;
          } catch {
            return null;
          }
        })
      ).then(results => results.filter(Boolean));
      
      const allAreas = [mainArea, ...linkedAreas];
      
      // Sort by page number if available
      allAreas.sort((a: any, b: any) => (a.page_number || 0) - (b.page_number || 0));
      
      // SIMPLIFIED APPROACH: Create clean combined canvas without complex header
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const spacing = 20; // Space between areas
      
      // Calculate total height needed (NO HEADER - logo will be HTML overlay)
      let totalHeight = 0;
      const areaImages: { area: any; img: HTMLImageElement; height: number }[] = [];
      
      // Load all area images
      for (const area of allAreas) {
        const img = await loadAreaImage(area);
        if (img) {
          const areaHeight = area.height;
          areaImages.push({ area, img, height: areaHeight });
          totalHeight += areaHeight + spacing;
        }
      }
      
      // Find max width
      const maxWidth = Math.max(...areaImages.map(ai => ai.area.width));
      
      // Set canvas size (NO HEADER SPACE)
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      
      // Draw all areas vertically (CLEAN - NO HEADER)
      let currentY = 0;
      for (const { area, img, height } of areaImages) {
        ctx.drawImage(
          img,
          area.x, area.y, area.width, area.height,
          0, currentY, area.width, area.height
        );
        currentY += height + spacing;
        
        // Draw separator line
        if (currentY < totalHeight) {
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, currentY - spacing / 2);
          ctx.lineTo(maxWidth, currentY - spacing / 2);
          ctx.stroke();
        }
      }
      
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      console.timeEnd('⚡ Simplified combined clip generation');
      console.log('✅ Clean combined clip created - logo will be added via server-side watermarking');
      return dataUrl;
    } catch (error) {
      console.error('❌ Failed to create combined clip:', error);
      console.timeEnd('⚡ Simplified combined clip generation');
      return null;
    }
  };

  const loadAreaImage = (area: any): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      // For now, use the current page image
      // In production, you'd fetch the specific page image
      if (imageRef.current) {
        resolve(imageRef.current);
      } else {
        resolve(null);
      }
    });
  };

  const drawHeaderWithLogo = async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Use category logo from cache
    try {
      const logoUrl = categoryLogoUrl || logoCache;
      if (logoUrl) {
        console.log('🎨 Drawing category logo from cache...', logoUrl);
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('⏱️ Logo load timeout');
            resolve();
          }, 2000); // 2s timeout
          
          logo.onload = () => {
            clearTimeout(timeout);
            // Make logo bigger - 75% of header height
            const logoHeight = height * 0.75;
            const logoWidth = (logo.width / logo.height) * logoHeight;
            const logoX = (width - logoWidth) / 2;
            const logoY = 15; // Slightly lower from top
            
            // NO LOGO - Logo will be added by EpaperClipDisplayWidget later
            // ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
            console.log(`ℹ️ Skipping logo drawing in PageViewer - will be added by EpaperClipDisplayWidget`);
            resolve();
          };
          logo.onerror = (err) => {
            clearTimeout(timeout);
            console.error('❌ Logo load error:', err);
            resolve();
          };
          logo.src = logoUrl;
        });
      } else {
        console.warn('⚠️ No category logo available');
      }
    } catch (error) {
      console.error('❌ Failed to load logo:', error);
    }
    
    // Draw text below logo
    ctx.fillStyle = '#1f2937'; // Dark gray
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${window.location.origin}/epaper/view/${editionId}`, width / 2, height - 40);
    
    if (editionData?.date) {
      ctx.font = '12px Arial';
      ctx.fillStyle = '#6b7280'; // Medium gray
      const date = new Date(editionData.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      ctx.fillText(`${date} - Page ${page?.number}`, width / 2, height - 20);
    }
  };

  const createClipFromArea = async (area: AreaMap) => {
    if (!imageRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = imageRef.current;
    
    // Area coordinates are already in natural image coordinates
    const sourceX = area.x;
    const sourceY = area.y;
    const sourceWidth = area.width;
    const sourceHeight = area.height;

    // SIMPLIFIED APPROACH: NO HEADER - clean clip only
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    // Draw ONLY the selected area (CLEAN - NO HEADER)
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle (what to clip)
      0, 0, sourceWidth, sourceHeight               // Destination rectangle (where to draw)
    );

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    console.log('✅ Clean clip created - logo will be added via server-side watermarking');
    return dataUrl;
  };



  const createClip = async () => {
    if (!clipStart || !clipEnd || !imageRef.current || !canvasRef.current) {
      console.error('❌ Missing required elements for clipping');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('❌ Could not get canvas context');
        return;
      }

      const img = imageRef.current;
      
      // Wait for image to be fully loaded
      if (!img.complete || img.naturalWidth === 0) {
        console.error('❌ Image not fully loaded');
        return;
      }

      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      const x = Math.min(clipStart.x, clipEnd.x) * scaleX;
      const y = Math.min(clipStart.y, clipEnd.y) * scaleY;
      const width = Math.abs(clipEnd.x - clipStart.x) * scaleX;
      const height = Math.abs(clipEnd.y - clipStart.y) * scaleY;

      // Validate dimensions
      if (width <= 0 || height <= 0) {
        console.error('❌ Invalid clip dimensions:', { width, height });
        return;
      }

      console.log('📏 Clip dimensions:', { x, y, width, height, scaleX, scaleY });

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw clipped portion
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      
      console.log('✅ Clip created successfully');
      
      // Reset clip state and exit clipping mode
      setClipStart(null);
      setClipEnd(null);
      
      // Call parent callback to open ShareModal
      onClipComplete(dataUrl);
      
    } catch (error) {
      console.error('❌ Error creating clip:', error);
    }
  };

  // Memoize clipRect calculation for better performance
  const clipRect = clipStart && clipEnd ? {
    left: Math.min(clipStart.x, clipEnd.x),
    top: Math.min(clipStart.y, clipEnd.y),
    width: Math.abs(clipEnd.x - clipStart.x),
    height: Math.abs(clipEnd.y - clipStart.y)
  } : null;

  return (
    <div 
      className="flex-1 flex items-center justify-center bg-white relative overflow-auto p-1 md:p-2"
      style={{
        width: containerWidth,
        height: containerHeight,
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {/* Navigation Buttons - Responsive - 6x size on desktop */}
      <button
        onClick={onPrevPage}
        className="absolute left-1 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-12 rounded-full shadow-lg transition-all z-10"
        title="Previous Page (←)"
      >
        <ChevronLeft className="w-4 h-4 md:w-24 md:h-24 text-gray-900" />
      </button>

      <button
        onClick={onNextPage}
        className="absolute right-1 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-12 rounded-full shadow-lg transition-all z-10"
        title="Next Page (→)"
      >
        <ChevronRight className="w-4 h-4 md:w-24 md:h-24 text-gray-900" />
      </button>



      {/* Page Container */}
      <div
        ref={containerRef}
        className={`relative bg-white shadow-2xl ${isClipping ? '' : 'cursor-grab active:cursor-grabbing'}`}
        style={{
          transform: `scale(${zoom})`,
          transition: 'transform 0.2s ease-out',
          transformOrigin: 'center center',
          touchAction: isClipping ? 'none' : 'auto'
        }}
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
              <div className="relative" style={{ 
                width: containerWidth !== 'auto' ? containerWidth : '900px',
                height: containerHeight !== 'auto' ? containerHeight : 'auto',
                maxWidth: '100%',
                maxHeight: '100%'
              }}>
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-600 p-8" style={{ height: '1200px' }}>
                  <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-semibold mb-2">PDF Preview</span>
                  <span className="text-sm text-center">PDF viewer temporarily disabled</span>
                  <a 
                    href={page.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Open PDF
                  </a>
                </div>
              </div>
            ) : (
              <div 
                className={`w-full md:w-auto ${!isClipping && areaMaps.length === 0 ? 'cursor-pointer' : ''}`} 
                style={{ 
                  width: containerWidth !== 'auto' ? containerWidth : '100%',
                  height: containerHeight !== 'auto' ? containerHeight : 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                onClick={(e) => {
                  // If no area maps and not in clipping mode, show full page zoom
                  if (!isClipping && areaMaps.length === 0 && page.imageUrl) {
                    e.stopPropagation();
                    console.log('📄 Full page zoom activated (no area maps)');
                    setZoomModalImage(page.imageUrl);
                    setZoomModalTitle('');
                  }
                }}
              >
                <OptimizedImage
                  ref={imageRef}
                  src={page.imageUrl}
                  alt={`Page ${page.number}`}
                  preset="page"
                  sizes={getEpaperImageSizes('page')}
                  className="h-auto select-none"
                  style={{
                    width: containerWidth !== 'auto' ? containerWidth : '100%',
                    height: containerHeight !== 'auto' ? containerHeight : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  priority={page.number === 1} // Prioritize first page
                  quality={85}
                  showLoadingSpinner={true}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    setImageScale(img.clientWidth / img.naturalWidth);
                  }}
                  onError={(e) => {
                    // Fallback placeholder
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1100'%3E%3Crect fill='%23f3f4f6' width='800' height='1100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%239ca3af' font-size='24' font-family='Arial'%3EPage ${page.number}%3C/text%3E%3C/svg%3E`;
                  }}
                />
              </div>
            )}
            
            {/* Area Maps - Interactive Regions */}
            {!isClipping && (() => {
              console.log('🎨 Rendering area maps:', areaMaps.length, 'Image scale:', imageScale);
              return areaMaps.map((area) => {
                console.log('📦 Rendering area:', area.id, 'Position:', { x: area.x, y: area.y, width: area.width, height: area.height });
                return (
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
                        : '2px solid transparent',
                      backgroundColor: hoveredArea?.id === area.id 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'transparent',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                    onMouseEnter={() => setHoveredArea(area)}
                    onMouseLeave={() => setHoveredArea(null)}
                    onClick={(e) => handleAreaClick(e, area)}
                    title={area.title}
                  />
                );
              });
            })()}
          </>
        ) : null}

        {/* Clipping Rectangle */}
        {clipRect && (
          <>
            {/* Rectangle border with move functionality */}
            <div
              className="absolute"
              style={{
                left: `${clipRect.left}px`,
                top: `${clipRect.top}px`,
                width: `${clipRect.width}px`,
                height: `${clipRect.height}px`,
                border: window.innerWidth <= 768 ? '3px solid #3b82f6' : '4px solid #3b82f6', // Thicker border on mobile
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                boxShadow: isMovingClip 
                  ? '0 0 0 1px rgba(59, 130, 246, 0.5), 0 8px 24px rgba(59, 130, 246, 0.4)' 
                  : '0 0 0 1px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(59, 130, 246, 0.3)',
                willChange: isMovingClip ? 'left, top' : 'auto',
                transform: 'translateZ(0)', // Force GPU acceleration
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transition: isMovingClip ? 'none' : 'box-shadow 0.2s ease',
                cursor: window.innerWidth <= 768 ? 'grab' : 'move', // Better mobile cursor
                pointerEvents: 'auto',
                touchAction: 'none', // Prevent default touch behaviors
                zIndex: 20,
                // Better mobile touch target
                minWidth: window.innerWidth <= 768 ? '200px' : 'auto',
                minHeight: window.innerWidth <= 768 ? '150px' : 'auto'
              }}
              onMouseDown={handleClipMoveStart}
              onTouchStart={handleClipMoveStart}
            />
            
            {/* Resize Handles - positioned individually to not block drag area */}
            {!isMovingClip && (
              <div 
                className="absolute pointer-events-none" 
                style={{
                  left: `${clipRect.left}px`,
                  top: `${clipRect.top}px`,
                  width: `${clipRect.width}px`,
                  height: `${clipRect.height}px`,
                  zIndex: 30
                }}
              >
                {/* Each handle is positioned absolutely and only covers its own area */}
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', top: '-6px', left: '-6px', width: '24px', height: '24px' }}>
                    <ResizeHandle position="top-left" onResizeStart={handleClipResizeStart} />
                  </div>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '24px' }}>
                    <ResizeHandle position="top" onResizeStart={handleClipResizeStart} />
                  </div>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', top: '-6px', right: '-6px', width: '24px', height: '24px' }}>
                    <ResizeHandle position="top-right" onResizeStart={handleClipResizeStart} />
                  </div>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', left: '-6px', transform: 'translateY(-50%)', width: '24px', height: '24px' }}>
                    <ResizeHandle position="left" onResizeStart={handleClipResizeStart} />
                  </div>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', right: '-6px', transform: 'translateY(-50%)', width: '24px', height: '24px' }}>
                    <ResizeHandle position="right" onResizeStart={handleClipResizeStart} />
                  </div>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', bottom: '-6px', left: '-6px', width: '24px', height: '24px' }}>
                    <ResizeHandle position="bottom-left" onResizeStart={handleClipResizeStart} />
                  </div>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '24px' }}>
                    <ResizeHandle position="bottom" onResizeStart={handleClipResizeStart} />
                  </div>
                  <div style={{ pointerEvents: 'auto', position: 'absolute', bottom: '-6px', right: '-6px', width: '24px', height: '24px' }}>
                    <ResizeHandle position="bottom-right" onResizeStart={handleClipResizeStart} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel and Share buttons - Better mobile positioning */}
      {clipRect && (
        <div 
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 md:absolute md:bottom-auto md:left-auto md:transform-none flex gap-3 pointer-events-auto z-[100] px-4"
          style={{
            ...(containerRef.current && window.innerWidth > 768 ? {
              left: `${containerRef.current.getBoundingClientRect().left - containerRef.current.parentElement!.getBoundingClientRect().left + clipRect.left * zoom}px`,
              top: `${containerRef.current.getBoundingClientRect().top - containerRef.current.parentElement!.getBoundingClientRect().top + (clipRect.top + clipRect.height + 10) * zoom}px`,
            } : {
              // Mobile: ensure buttons are always visible and accessible
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'auto',
              maxWidth: 'calc(100vw - 32px)'
            })
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('❌ Cancel button clicked');
              onClipCancel();
            }}
            className="px-6 py-4 md:px-16 md:py-12 bg-red-600 text-white rounded-xl md:rounded shadow-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium flex items-center gap-2 text-base md:text-4xl min-w-[140px] md:min-w-[400px] justify-center touch-manipulation"
          >
            <X className="w-5 h-5 md:w-16 md:h-16" />
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('📤 Share button clicked - opening clipped image');
              createClip();
            }}
            className="px-6 py-4 md:px-16 md:py-12 bg-green-600 text-white rounded-xl md:rounded shadow-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium flex items-center gap-2 text-base md:text-4xl min-w-[140px] md:min-w-[400px] justify-center touch-manipulation"
          >
            <svg className="w-5 h-5 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      )}

      {/* Hidden Canvas for Clipping */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Zoom Modal */}
      {zoomModalImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 gap-4"
          style={{
            touchAction: 'none', // Prevent browser gestures
            overscrollBehavior: 'contain' // Prevent pull-to-refresh and swipe navigation
          }}
          onClick={() => {
            setZoomModalImage(null);
            setZoomModalTitle('');
            setSelectedArea(null);
            setIsZoomedIn(false);
            setZoomOrigin({ x: 50, y: 50 }); // Reset zoom origin
          }}
          onTouchStart={(e) => {
            // Prevent default touch behavior to stop browser gestures
            if (e.touches.length > 1) {
              e.preventDefault();
            }
          }}
          onTouchMove={(e) => {
            // Prevent swipe gestures
            e.stopPropagation();
          }}
        >
          {/* Close Button - Top Right Corner */}
          <button
            onClick={() => {
              setZoomModalImage(null);
              setZoomModalTitle('');
              setSelectedArea(null);
              setIsZoomedIn(false);
              setZoomOrigin({ x: 50, y: 50 }); // Reset zoom origin
            }}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white p-3 md:p-12 rounded-full shadow-lg z-20"
          >
            <X className="w-6 h-6 md:w-24 md:h-24 text-gray-900" />
          </button>
          
          {/* Combined Image Container - CANVAS APPROACH */}
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-[90vw] max-h-[75vh] overflow-auto"
            style={{
              touchAction: 'pan-y pan-x',
              overscrollBehavior: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <OptimizedImage 
                src={zoomModalImage} 
                alt="Article"
                preset="gallery"
                quality={90}
                className={`h-auto transition-transform duration-300 ease-in-out ${
                  selectedArea 
                    ? (isZoomedIn ? 'w-auto cursor-zoom-out' : 'w-full cursor-zoom-in')
                    : 'w-full cursor-default'
                }`}
                style={{
                  transform: isZoomedIn ? 'scale(1.5)' : 'scale(1)',
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                }}
                onClick={(e) => {
                  // Only allow zoom if opened from area map
                  if (!selectedArea) return;
                  
                  e.stopPropagation();
                  
                  // Calculate cursor position relative to image
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  
                  // Set zoom origin to cursor position
                  setZoomOrigin({ x, y });
                  
                  // Toggle zoom
                  setIsZoomedIn(!isZoomedIn);
                }}
                title={selectedArea ? (isZoomedIn ? 'Click to zoom out' : 'Click to zoom in') : ''}
              />
            </div>
          </div>
          
          {/* Action Buttons - Outside Paper, Below */}
          <div className="flex gap-3 z-10" onClick={(e) => e.stopPropagation()}>
            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = zoomModalImage;
                link.download = `article-${Date.now()}.png`;
                link.click();
              }}
              className="px-6 py-3 md:px-24 md:py-12 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 text-base md:text-4xl"
            >
              <svg className="w-5 h-5 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>
      )}
      {/* Area Map Modal */}
      {showAreaMapModal && selectedAreaMapId && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={handleCloseAreaMapModal}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseAreaMapModal}
              className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal Content - Render Epaper Map Layout */}
            <div className="p-6">
              <EpaperMapLayoutContent 
                areaMapId={selectedAreaMapId.toString()}
                editionId={editionId || ''}
                pageNumber={page?.number?.toString() || ''}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to render Epaper Map layout content inside modal
function EpaperMapLayoutContent({ areaMapId, editionId, pageNumber }: { areaMapId: string; editionId: string; pageNumber: string }) {
  const [layoutData, setLayoutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      setLoading(true);
      console.log('🎨 Fetching Epaper Map layout...');
      console.log('📊 Props passed to EpaperMapLayoutContent:', { areaMapId, editionId, pageNumber });
      
      const response = await fetch(`/api/layouts/Epaper Map`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      console.log('📡 Layout API response status:', response.status);
      const data = await response.json();
      console.log('📄 Layout API response:', data);
      
      if (data.success) {
        console.log('✅ Layout data received:', data.data);
        console.log('🏗️ Layout structure preview:', data.data.structure ? 'Has structure' : 'No structure');
        setLayoutData(data.data);
      } else {
        console.error('❌ Layout API error:', data.error);
      }
    } catch (error) {
      console.error('💥 Error fetching layout:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    console.log('⏳ EpaperMapLayoutContent: Loading...');
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Epaper Map Layout...</p>
        </div>
      </div>
    );
  }

  if (!layoutData) {
    console.log('❌ EpaperMapLayoutContent: No layout data');
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Layout Not Found</h3>
        <p className="text-red-700">Failed to load "Epaper Map" layout</p>
        <p className="text-sm text-red-600 mt-2">Check console for details</p>
      </div>
    );
  }

  // Parse layout structure if it's a string
  const layoutContent = typeof layoutData.structure === 'string' 
    ? JSON.parse(layoutData.structure) 
    : layoutData.structure || layoutData.content || layoutData;
  
  console.log('🏗️ Parsed layout content:', layoutContent);
  
  return (
    <>
      {/* Custom CSS */}
      {layoutData.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: layoutData.custom_css }} />
      )}

      {/* Render Layout Structure */}
      <div className="layout-renderer" data-layout="Epaper Map">
        {layoutContent.rows?.map((row: any) => (
          <div 
            key={row.id} 
            className={`layout-row ${row.properties?.cssClass || row.cssClass || ''}`}
            style={parseInlineStyle(row.properties?.customCss || row.properties?.customStyle || row.customStyle)}
          >
            <div className="flex flex-wrap">
              {row.columns?.map((column: any) => (
                <div
                  key={column.id}
                  className={`layout-column ${column.properties?.cssClass || column.cssClass || ''}`}
                  style={{
                    flex: `0 0 ${((column.width || 6) / 12) * 100}%`,
                    maxWidth: `${((column.width || 6) / 12) * 100}%`,
                    boxSizing: 'border-box',
                    ...parseInlineStyle(column.properties?.customCss || column.properties?.customStyle || column.customStyle),
                  }}
                >
                  {/* Render Widgets */}
                  {column.widgets?.map((widget: any) => (
                    <div key={widget.id} className={`widget ${widget.config?.cssClasses || ''}`}>
                      {renderWidget(widget, areaMapId, editionId, pageNumber)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Widget rendering function (simplified version for modal)
function renderWidget(widget: any, areaMapId?: string, editionId?: string, pageNumber?: string) {
  switch (widget.type) {
    case 'social':
      return <SocialWidget config={widget.config} />;
      
    case 'epaper-area-map':
    case 'epaper-area-map-display':
      console.log('🎯 Rendering EpaperAreaMapDisplayWidget with:', { areaMapId, editionId, pageNumber, config: widget.config });
      return <EpaperAreaMapDisplayWidget config={widget.config} areaMapId={areaMapId} editionId={editionId} pageNumber={pageNumber} />;
      
    case 'text':
    case 'html':
      return (
        <div 
          className={widget.config.cssClasses || ''}
          style={parseInlineStyle(widget.config.style)}
          dangerouslySetInnerHTML={{ __html: widget.config.content || widget.config.html }} 
        />
      );
      
    default:
      return null;
  }
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
