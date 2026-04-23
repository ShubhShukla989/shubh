import { useState, useEffect, useRef, useMemo } from 'react';
import { applyClientWatermark, type ClientWatermarkSettings } from '@/lib/clientWatermark';

// Define the props interface
interface PageViewerProps {
  page: {
    number: number;
    imageUrl: string;
    id: string | number;
  };
  zoom: number;
  isClipping: boolean;
  onClipComplete: (imageBlob: Blob) => void;
  onClipCancel: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  loading: boolean;
  editionId: string;
  totalPages: number;
  areaMaps?: Array<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    title?: string;
    page_number: number;
  }>;
  onAreaClick?: (area: any) => void;
  onFullPageClick?: () => void;
  watermarkSettings?: {
    enable_watermarking: boolean;
    logo_url: string;
    opacity: number;
    position: string;
    background_color: string;
    foreground_color: string;
    enable_border: boolean;
    border_width: number;
    border_color: string;
    info_text: string;
    info_text_font: string;
  } | null;
  edition?: {
    id: number;
    title: string;
    created_at?: string;
    date?: string; // Publication date set by admin
    category_id?: number;
  } | null;
  currentPageData?: {
    id: number;
    page_number: number;
    image_url: string;
    title?: string;
  } | null;
}

interface ClipSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

const LazyPageViewer = ({
  page,
  zoom,
  isClipping,
  onClipComplete,
  onClipCancel,
  onPrevPage,
  onNextPage,
  loading,
  editionId,
  totalPages,
  areaMaps = [],
  onAreaClick,
  onFullPageClick,
  watermarkSettings = null,
  edition = null,
  currentPageData = null
}: PageViewerProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false); // Control when to start loading
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<ClipSelection | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [isMovingBox, setIsMovingBox] = useState(false);
  const [moveStartPoint, setMoveStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showButtons, setShowButtons] = useState(true); // Control button visibility during resize

  // Use original image for display (no watermark on main page)
  const displayImageUrl = page.imageUrl;

  // Memoize area map pixel positions — computed once per imageLoaded/areaMaps change,
  // not recalculated for every area on every render (prevents layout thrashing).
  const areaMapPositions = useMemo(() => {
    if (!imageLoaded || !imageRef.current || areaMaps.length === 0) return [];
    const img = imageRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const containerWidth = img.clientWidth;
    const containerHeight = img.clientHeight;
    if (!naturalWidth || !naturalHeight) return [];

    const naturalAspect = naturalWidth / naturalHeight;
    const containerAspect = containerWidth / containerHeight;
    let renderedWidth: number, renderedHeight: number, offsetX = 0, offsetY = 0;

    if (containerAspect > naturalAspect) {
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * naturalAspect;
      offsetX = (containerWidth - renderedWidth) / 2;
    } else {
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / naturalAspect;
      offsetY = (containerHeight - renderedHeight) / 2;
    }

    const scale = renderedWidth / naturalWidth;
    return areaMaps.map(area => ({
      id: area.id,
      x: area.x * scale + offsetX,
      y: area.y * scale + offsetY,
      width: area.width * scale,
      height: area.height * scale,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageLoaded, areaMaps, isMobile]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Intersection Observer for lazy loading from top to bottom
  useEffect(() => {
    if (!containerRef.current) return;

    // Immediately load if in viewport (fixes initial load issue)
    const rect = containerRef.current.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isInViewport) {
      setShouldLoad(true);
      return; // No need to observe if already in viewport
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect(); // Stop observing once we start loading
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before the image enters viewport
        threshold: 0.01
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Reset states when page changes and cancel any pending image loads
  useEffect(() => {
    // Cancel any pending image loads from previous page
    setImageLoaded(false);
    setSelection(null);
    setIsSelecting(false);
    
    // Immediately check if image is already loaded (cached) or complete
    const checkImageLoad = () => {
      if (imageRef.current) {
        if (imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
          setImageLoaded(true);
        } else {
          // Force a recheck after a short delay for cached images
          setTimeout(() => {
            if (imageRef.current && imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
              setImageLoaded(true);
            }
          }, 50);
        }
      }
    };
    
    checkImageLoad();
    
    // Cleanup function to abort image loading if component unmounts
    return () => {
      if (imageRef.current) {
        imageRef.current.src = ''; // Clear src to stop loading
      }
    };
  }, [page.id, page.imageUrl]);

  // Reset selection when clipping mode changes
  useEffect(() => {
    if (!isClipping) {
      setSelection(null);
      setIsSelecting(false);
      setIsDragging(false);
      setDragHandle(null);
      setIsMovingBox(false);
      setMoveStartPoint(null);
    } else if (isClipping && imageLoaded && !selection) {
      // Auto-create default selection box when clipping mode starts
      setTimeout(() => {
        if (imageRef.current && containerRef.current) {
          const imgRect = imageRef.current.getBoundingClientRect();
          
          if (imgRect.width > 0 && imgRect.height > 0) {
            const defaultWidth = imgRect.width * 0.4;
            const defaultHeight = imgRect.height * 0.4;
            const defaultX = (imgRect.width - defaultWidth) / 2;
            const defaultY = (imgRect.height - defaultHeight) / 2;
            
            setSelection({
              x: defaultX,
              y: defaultY,
              width: defaultWidth,
              height: defaultHeight
            });
          }
        }
      }, 100);
    }
  }, [isClipping, imageLoaded, selection]);

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Get area map at specific position (UPDATED WITH LETTERBOX/PILLARBOX FIX)
  const getAreaAtPosition = (x: number, y: number, areas: any[]) => {
    if (!imageRef.current) return null;
    
    // Get dimensions
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    const containerWidth = imageRef.current.clientWidth;
    const containerHeight = imageRef.current.clientHeight;
    
    // Calculate actual rendered image dimensions (accounting for object-fit: contain)
    const naturalAspect = naturalWidth / naturalHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let renderedWidth: number;
    let renderedHeight: number;
    let offsetX = 0;
    let offsetY = 0;
    
    if (containerAspect > naturalAspect) {
      // Container is wider - image will have pillarboxing (vertical bars on sides)
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * naturalAspect;
      offsetX = (containerWidth - renderedWidth) / 2;
    } else {
      // Container is taller - image will have letterboxing (horizontal bars on top/bottom)
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / naturalAspect;
      offsetY = (containerHeight - renderedHeight) / 2;
    }
    
    // Calculate scale using actual rendered dimensions
    const imageScale = renderedWidth / naturalWidth;
    
    // Adjust click coordinates to remove offset
    const adjustedX = x - offsetX;
    const adjustedY = y - offsetY;
    
    // Convert click coordinates to natural image coordinates
    const imageX = adjustedX / imageScale;
    const imageY = adjustedY / imageScale;
    
    // Check each area map (in reverse order to prioritize top areas)
    for (let i = areas.length - 1; i >= 0; i--) {
      const area = areas[i];
      if (imageX >= area.x && 
          imageX <= area.x + area.width && 
          imageY >= area.y && 
          imageY <= area.y + area.height) {
        return area;
      }
    }
    
    return null;
  };

  // Get relative coordinates within the image
  const getRelativeCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageRef.current || !containerRef.current) return { x: 0, y: 0 };
    
    const rect = imageRef.current.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Handle mouse/touch down for selection start
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    // CRITICAL FIX: For touch devices, DO NOT trigger actions on mousedown/touchstart
    // Only record state and wait for touchend validation
    
    // Detect if this is a touch event
    const isTouchEvent = 'touches' in e;
    
    // If not in clipping mode, handle regular page clicks
    if (!isClipping && imageLoaded) {
      // FOR TOUCH DEVICES: Do nothing on touchstart, wait for touchend
      if (isTouchEvent) {
        // Touch handling is done by area map divs' touch handlers
        // Do NOT trigger any actions here
        return;
      }
      
      // FOR MOUSE DEVICES ONLY: Handle clicks immediately
      // Check if there are any area maps for this page (already filtered in StaticEpaperLayout)
      if (areaMaps.length === 0) {
        // No area maps exist - open full page modal
        if (onFullPageClick) {
          onFullPageClick();
        }
        return;
      }
      
      // Area maps exist - check if click is on any area map
      const coords = getRelativeCoordinates(e);
      const clickedArea = getAreaAtPosition(coords.x, coords.y, areaMaps);
      
      if (clickedArea && onAreaClick) {
        onAreaClick(clickedArea);
        return;
      }
      
      // Click was outside all area maps - do nothing
      return;
    }
    
    // Original clipping mode logic
    if (!isClipping || !imageLoaded) return;
    
    const coords = getRelativeCoordinates(e);
    
    // Check if clicking on a handle
    if (selection) {
      const handle = getHandleAtPosition(coords.x, coords.y);
      if (handle) {
        setDragHandle(handle);
        setIsDragging(true);
        startResizeOrMove(); // Hide buttons during resize
        return;
      }
      
      // Check if clicking inside the selection box to move it
      if (isInsideSelection(coords.x, coords.y)) {
        setIsMovingBox(true);
        setMoveStartPoint(coords);
        startResizeOrMove(); // Hide buttons during move
        return;
      }
    }
    
    // If no selection exists and user clicks, create one manually
    if (!selection && imageRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      
      if (imgRect.width > 0 && imgRect.height > 0) {
        const defaultWidth = imgRect.width * 0.4;
        const defaultHeight = imgRect.height * 0.4;
        const defaultX = (imgRect.width - defaultWidth) / 2;
        const defaultY = (imgRect.height - defaultHeight) / 2;
        
        setSelection({
          x: defaultX,
          y: defaultY,
          width: defaultWidth,
          height: defaultHeight
        });
      }
    }
  };

  // Handle mouse/touch move for selection
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isClipping || !imageLoaded) return;
    
    const coords = getRelativeCoordinates(e);
    
    if (isDragging && dragHandle && selection) {
      // Resize selection based on handle
      const newSelection = resizeSelection(selection, dragHandle, coords);
      setSelection(newSelection);
    } else if (isMovingBox && moveStartPoint && selection) {
      // Move the entire selection box
      const deltaX = coords.x - moveStartPoint.x;
      const deltaY = coords.y - moveStartPoint.y;
      
      const newSelection = {
        x: selection.x + deltaX,
        y: selection.y + deltaY,
        width: selection.width,
        height: selection.height
      };
      
      // Keep selection within image bounds
      if (imageRef.current) {
        const imgRect = imageRef.current.getBoundingClientRect();
        newSelection.x = Math.max(0, Math.min(newSelection.x, imgRect.width - newSelection.width));
        newSelection.y = Math.max(0, Math.min(newSelection.y, imgRect.height - newSelection.height));
      }
      
      setSelection(newSelection);
      setMoveStartPoint(coords);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setStartPoint(null);
    }
    if (isDragging) {
      setIsDragging(false);
      setDragHandle(null);
      endResizeOrMove(); // Show buttons after resize
    }
    if (isMovingBox) {
      setIsMovingBox(false);
      setMoveStartPoint(null);
      endResizeOrMove(); // Show buttons after move
    }
  };

  // Get handle at position — must mirror renderHandles constants exactly
  const getHandleAtPosition = (x: number, y: number) => {
    if (!selection) return null;

    const BASE_SIZE = isMobile ? 16 : 32;
    const SE_SIZE = isMobile ? (16 * 3) / 2 : 32 * 3;
    const BW = isMobile ? 2 : 1;
    const TP = isMobile ? 12 : 8; // touch/click tolerance padding

    const { x: sx, y: sy, width: sw, height: sh } = selection;

    // Positions mirror renderHandles CSS exactly
    // Corners
    const nw = { x: sx + BW,            y: sy + BW,            w: BASE_SIZE, h: BASE_SIZE };
    const ne = { x: sx + sw - BW - BASE_SIZE, y: sy + BW,       w: BASE_SIZE, h: BASE_SIZE };
    const sw_ = { x: sx + BW,           y: sy + sh - BW - BASE_SIZE, w: BASE_SIZE, h: BASE_SIZE };
    const se = { x: sx + sw - BW - SE_SIZE,   y: sy + sh - BW - SE_SIZE, w: SE_SIZE,   h: SE_SIZE   };
    // Edges (centered)
    const n  = { x: sx + sw / 2 - BASE_SIZE / 2, y: sy + BW,            w: BASE_SIZE, h: BASE_SIZE };
    const s  = { x: sx + sw / 2 - BASE_SIZE / 2, y: sy + sh - BW - BASE_SIZE, w: BASE_SIZE, h: BASE_SIZE };
    const w  = { x: sx + BW,            y: sy + sh / 2 - BASE_SIZE / 2, w: BASE_SIZE, h: BASE_SIZE };
    const e  = { x: sx + sw - BW - BASE_SIZE, y: sy + sh / 2 - BASE_SIZE / 2, w: BASE_SIZE, h: BASE_SIZE };

    const hitBoxes: Array<{ name: string; x: number; y: number; w: number; h: number }> = [
      { name: 'se', ...se },
      { name: 'nw', ...nw },
      { name: 'ne', ...ne },
      { name: 'sw', ...sw_ },
      { name: 'n',  ...n  },
      { name: 's',  ...s  },
      { name: 'w',  ...w  },
      { name: 'e',  ...e  },
    ];

    for (const box of hitBoxes) {
      if (
        x >= box.x - TP && x <= box.x + box.w + TP &&
        y >= box.y - TP && y <= box.y + box.h + TP
      ) {
        return box.name;
      }
    }

    return null;
  };
  
  // Hide buttons when starting resize/move
  const startResizeOrMove = () => {
    setShowButtons(false);
  };
  
  // Show buttons when resize/move ends
  const endResizeOrMove = () => {
    setShowButtons(true);
  };

  // Check if point is inside selection box
  const isInsideSelection = (x: number, y: number) => {
    if (!selection) return false;
    
    return x >= selection.x && x <= selection.x + selection.width &&
           y >= selection.y && y <= selection.y + selection.height;
  };

  // Resize selection based on handle
  const resizeSelection = (sel: ClipSelection, handle: string, coords: { x: number; y: number }) => {
    let { x, y, width, height } = sel;
    
    switch (handle) {
      case 'nw':
        width += x - coords.x;
        height += y - coords.y;
        x = coords.x;
        y = coords.y;
        break;
      case 'n':
        height += y - coords.y;
        y = coords.y;
        break;
      case 'ne':
        width = coords.x - x;
        height += y - coords.y;
        y = coords.y;
        break;
      case 'e':
        width = coords.x - x;
        break;
      case 'se':
        width = coords.x - x;
        height = coords.y - y;
        break;
      case 's':
        height = coords.y - y;
        break;
      case 'sw':
        width += x - coords.x;
        height = coords.y - y;
        x = coords.x;
        break;
      case 'w':
        width += x - coords.x;
        x = coords.x;
        break;
    }
    
    // Ensure minimum size
    if (width < 10) width = 10;
    if (height < 10) height = 10;
    
    return { x, y, width, height };
  };

  // REWRITTEN: Handle clip completion with improved logic
  const handleClipConfirm = async () => {
    if (!selection || !imageRef.current) {
      return;
    }
    
    try {
      // Step 1: Get image dimensions
      const imageElement = imageRef.current;
      const naturalWidth = imageElement.naturalWidth;
      const naturalHeight = imageElement.naturalHeight;
      const containerWidth = imageElement.clientWidth;
      const containerHeight = imageElement.clientHeight;
      
      // Step 2: Validate dimensions
      if (naturalWidth === 0 || naturalHeight === 0) {
        throw new Error('Invalid image dimensions');
      }
      
      // Step 3: Calculate ACTUAL rendered image dimensions (accounting for object-fit: contain)
      const naturalAspect = naturalWidth / naturalHeight;
      const containerAspect = containerWidth / containerHeight;
      
      let renderedWidth: number;
      let renderedHeight: number;
      let offsetX = 0;
      let offsetY = 0;
      
      if (containerAspect > naturalAspect) {
        renderedHeight = containerHeight;
        renderedWidth = containerHeight * naturalAspect;
        offsetX = (containerWidth - renderedWidth) / 2;
      } else {
        renderedWidth = containerWidth;
        renderedHeight = containerWidth / naturalAspect;
        offsetY = (containerHeight - renderedHeight) / 2;
      }
      
      // Step 4: Calculate scale factor using ACTUAL rendered dimensions
      const scale = naturalWidth / renderedWidth;
      
      // Step 5: Adjust selection coordinates to account for letterbox/pillarbox offset
      const adjustedSelection = {
        x: selection.x - offsetX,
        y: selection.y - offsetY,
        width: selection.width,
        height: selection.height
      };
      
      // Step 6: Convert selection to natural coordinates
      const cropArea = {
        x: Math.max(0, Math.round(adjustedSelection.x * scale)),
        y: Math.max(0, Math.round(adjustedSelection.y * scale)),
        width: Math.round(adjustedSelection.width * scale),
        height: Math.round(adjustedSelection.height * scale)
      };
      
      // Ensure crop area is within image bounds
      cropArea.x = Math.max(0, Math.min(cropArea.x, naturalWidth));
      cropArea.y = Math.max(0, Math.min(cropArea.y, naturalHeight));
      cropArea.width = Math.min(cropArea.width, naturalWidth - cropArea.x);
      cropArea.height = Math.min(cropArea.height, naturalHeight - cropArea.y);
      
      // Step 7: Create cropped image — binary blob, reusing existing img element
      const croppedImage = await createCroppedImage(imageElement, cropArea);

      // Step 8: Apply watermark strip client-side (zero server CPU)
      const wmSettings: ClientWatermarkSettings = watermarkSettings ?? { enable_watermarking: false };
      const wmContext = {
        editionTitle: edition?.title,
        date: edition?.date ? new Date(edition.date).toLocaleDateString('en-GB') : undefined,
        pageNumber: page.number,
        url: '', // clip URL not known yet — server will have it, but strip still looks good
      };
      const watermarkedBlob = await applyClientWatermark(croppedImage, wmSettings, wmContext);

      onClipComplete(watermarkedBlob);
      
    } catch (error) {
      alert(`Failed to create clip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Crop the already-loaded <img> element directly — no second network/decode.
  // Caps output at 1200px wide to prevent huge canvas allocations.
  // Uses toBlob (binary, non-blocking) instead of toDataURL (base64, +33% size, blocking).
  const createCroppedImage = (
    imgEl: HTMLImageElement,
    cropArea: { x: number; y: number; width: number; height: number }
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const MAX_OUT = 1200;
        const scale = cropArea.width > MAX_OUT ? MAX_OUT / cropArea.width : 1;
        const outW = Math.round(cropArea.width * scale);
        const outH = Math.round(cropArea.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
        // Draw directly from the already-decoded img element — no re-fetch, no re-decode
        ctx.drawImage(imgEl, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, outW, outH);

        // toBlob is non-blocking (runs off main thread in most browsers)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('toBlob returned null'));
          },
          'image/webp',
          0.92
        );
      } catch (err) {
        reject(err);
      }
    });
  };

  // Render selection handles
  const renderHandles = () => {
    if (!selection) return null;

    // Handle sizing — consistent, not dependent on isMobile state timing
    const BASE_SIZE = isMobile ? 16 : 32;           // PC: 2x size
    const SE_SIZE = isMobile ? (16 * 3) / 2 : 32 * 3;  // mobile: half of 3x, PC: 3x of 32
    const BW = isMobile ? 2 : 1;   // matches selection box border width

    // Base style — no border, no outline
    const base: React.CSSProperties = {
      position: 'absolute',
      width: BASE_SIZE,
      height: BASE_SIZE,
      backgroundColor: '#3b82f6',
      borderRadius: '1px',
      zIndex: 10000,
      boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
      touchAction: 'none',
    };

    // SE handle — 3x size, always prominent
    const seLarge: React.CSSProperties = {
      ...base,
      width: SE_SIZE,
      height: SE_SIZE,
      zIndex: 10001,
      cursor: 'se-resize',
    };

    // SE handle on mobile — blue, half size
    const seMobile: React.CSSProperties = {
      position: 'absolute',
      width: SE_SIZE / 2,
      height: SE_SIZE / 2,
      backgroundColor: '#3b82f6',
      border: 'none',
      borderRadius: '1px',
      zIndex: 10001,
      cursor: 'se-resize',
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
      pointerEvents: 'auto',
      touchAction: 'none',
    };

    const handles: Array<{ name: string; style: React.CSSProperties; mobileClass?: boolean }> = [
      // Corners — flush to 2 sides each
      { name: 'nw', style: { ...base,    top: BW,    left: BW,    cursor: 'nw-resize' } },
      { name: 'ne', style: { ...base,    top: BW,    right: BW,   cursor: 'ne-resize' } },
      { name: 'sw', style: { ...base,    bottom: BW, left: BW,    cursor: 'sw-resize' } },
      { name: 'se', style: isMobile ? { ...seMobile, bottom: BW, right: BW } : { ...seLarge, bottom: BW, right: BW }, mobileClass: isMobile },
      // Edges — flush to 1 side, centered on the other
      { name: 'n',  style: { ...base, top: BW,    left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
      { name: 's',  style: { ...base, bottom: BW, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
      { name: 'w',  style: { ...base, left: BW,   top: '50%',  transform: 'translateY(-50%)', cursor: 'w-resize' } },
      { name: 'e',  style: { ...base, right: BW,  top: '50%',  transform: 'translateY(-50%)', cursor: 'e-resize' } },
    ];

    return (
      // Wrapper sits exactly over the selection box — handles use CSS positioning inside
      <div
        style={{
          position: 'absolute',
          left: selection.x,
          top: selection.y,
          width: selection.width,
          height: selection.height,
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      >
        {handles.map(({ name, style, mobileClass }) => (
          <div
            key={name}
            className={mobileClass ? 'resize-handle-se-mobile' : 'resize-handle'}
            style={style}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragHandle(name);
              setIsDragging(true);
              startResizeOrMove();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setDragHandle(name);
              setIsDragging(true);
              startResizeOrMove();
            }}
          />
        ))}
      </div>
    );
  };

  // Remove loading screen - let images load progressively with lazy loading

  return (
    <>
    <style>{`
      .area-map-overlay {
        background-color: transparent;
        border: none;
        transition: all 0.2s ease;
      }
      .area-map-overlay:hover {
        background-color: rgba(229, 231, 235, 0.2);
        border: 4px solid #dc2626 !important;
      }
    `}</style>
    <div className="newspaper-page-container" style={{ 
      width: '100%', 
      height: 'auto',
      position: 'relative',
      overflow: 'visible'
    }}>
      <div 
        ref={containerRef}
        className="relative w-full overflow-visible"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{ 
          cursor: isClipping ? 'crosshair' : 'default',
          userSelect: 'none',
          touchAction: isClipping ? 'none' : 'auto'
        }}
      >
        <img
          ref={(img) => {
            // Store ref
            (imageRef as any).current = img;
            
            // Immediately check if image is already loaded (for cached images)
            if (img && img.complete && img.naturalHeight !== 0) {
              // Use setTimeout to ensure state update happens after render
              setTimeout(() => handleImageLoad(), 0);
            }
          }}
          src={displayImageUrl}
          alt={`Page ${page.number}`}
          loading="eager"
          // @ts-ignore — fetchPriority is valid but not yet in all TS DOM types
          fetchPriority="high"
          className="w-full h-auto object-contain"
          onLoad={handleImageLoad}
          onError={(e) => {
            // Fallback to original image if display image fails
            if (e.currentTarget.src !== page.imageUrl) {
              e.currentTarget.src = page.imageUrl;
            } else {
              setImageLoaded(false);
            }
          }}
          style={{ 
            width: '100%',
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
            userSelect: 'none',
            pointerEvents: 'auto',
            minHeight: 'auto'
          }}
          draggable={false}
        />
        
        {/* Area Maps - Clickable regions, positions pre-computed via useMemo */}
        {!isClipping && areaMapPositions.length > 0 && areaMaps.map((area, index) => {
          const pos = areaMapPositions[index];
          if (!pos) return null;
          const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = pos;
          
          return (
            <div
              key={area.id}
              onClick={(e) => {
                // DESKTOP ONLY: Only trigger on mouse click, not touch
                // If touch was used, ignore this click event
                if (e.currentTarget.dataset.touchActive === 'true') {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                // Real mouse click (desktop) - trigger immediately
                onAreaClick && onAreaClick(area);
              }}
              onTouchStart={(e) => {
                // PHASE 1: Record initial state only - DO NOT trigger action
                const touch = e.touches[0];
                const target = e.currentTarget;
                
                // Mark that touch is active (prevents onClick from firing)
                target.dataset.touchActive = 'true';
                
                // Store touch session data
                target.dataset.touchStartX = touch.clientX.toString();
                target.dataset.touchStartY = touch.clientY.toString();
                target.dataset.touchStartTime = Date.now().toString();
                target.dataset.isScrolling = 'false';
                target.dataset.hasMoved = 'false';
                
                // Visual feedback only (subtle highlight)
                target.style.backgroundColor = 'rgba(229, 231, 235, 0.1)';
              }}
              onTouchMove={(e) => {
                // PHASE 2: Track movement - detect scroll intent
                const touch = e.touches[0];
                const target = e.currentTarget;
                const startX = parseFloat(target.dataset.touchStartX || '0');
                const startY = parseFloat(target.dataset.touchStartY || '0');
                
                const deltaX = Math.abs(touch.clientX - startX);
                const deltaY = Math.abs(touch.clientY - startY);
                
                // If moved more than 10px, it's likely a scroll
                if (deltaX > 10 || deltaY > 10) {
                  target.dataset.hasMoved = 'true';
                  target.dataset.isScrolling = 'true';
                  // Remove visual feedback - user is scrolling
                  target.style.backgroundColor = 'transparent';
                }
              }}
              onTouchEnd={(e) => {
                // PHASE 3: Validate gesture and trigger action ONLY if valid tap
                const touch = e.changedTouches[0];
                const target = e.currentTarget;
                const startX = parseFloat(target.dataset.touchStartX || '0');
                const startY = parseFloat(target.dataset.touchStartY || '0');
                const startTime = parseInt(target.dataset.touchStartTime || '0');
                const isScrolling = target.dataset.isScrolling === 'true';
                
                // Calculate gesture metrics
                const deltaX = Math.abs(touch.clientX - startX);
                const deltaY = Math.abs(touch.clientY - startY);
                const deltaTime = Date.now() - startTime;
                
                // Remove visual feedback
                target.style.backgroundColor = 'transparent';
                
                // VALIDATION: Check if it's a valid tap
                const isValidTap = (
                  !isScrolling &&                    // Not scrolling
                  deltaX < 30 &&                     // Minimal horizontal movement
                  deltaY < 30 &&                     // Minimal vertical movement
                  deltaTime >= 30 &&                 // Not too fast (accidental)
                  deltaTime <= 150                   // Not too slow (hold/scroll)
                );
                
                // CRITICAL: Always prevent default to stop onClick from firing
                e.preventDefault();
                e.stopPropagation();
                
                // ONLY trigger action if valid tap
                if (isValidTap) {
                  onAreaClick && onAreaClick(area);
                }
                
                // Cleanup: Reset all flags (with delay to ensure onClick is blocked)
                setTimeout(() => {
                  target.dataset.touchActive = 'false';
                  target.dataset.touchStartX = '';
                  target.dataset.touchStartY = '';
                  target.dataset.touchStartTime = '';
                  target.dataset.isScrolling = 'false';
                  target.dataset.hasMoved = 'false';
                }, 100);
              }}
              onTouchCancel={(e) => {
                // PHASE 4: Handle gesture cancellation (e.g., incoming call)
                const target = e.currentTarget;
                
                // Remove visual feedback
                target.style.backgroundColor = 'transparent';
                
                // Cleanup: Reset all flags (with delay to ensure onClick is blocked)
                setTimeout(() => {
                  target.dataset.touchActive = 'false';
                  target.dataset.touchStartX = '';
                  target.dataset.touchStartY = '';
                  target.dataset.touchStartTime = '';
                  target.dataset.isScrolling = 'false';
                  target.dataset.hasMoved = 'false';
                }, 100);
              }}
              className="area-map-overlay"
              style={{
                position: 'absolute',
                left: `${displayX}px`,
                top: `${displayY}px`,
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                cursor: 'pointer',
                zIndex: 100 + (areaMaps.length - index),
                boxSizing: 'border-box',
                touchAction: 'manipulation'
              }}
              title={area.title || `Area ${area.id}`}
            />
          );
        })}
        
        {/* Selection overlay */}
        {isClipping && selection && (
          <>
            {/* Selection rectangle */}
            <div
              className="clipping-rectangle"
              style={{
                position: 'absolute',
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
                border: isMobile ? '2px solid #3b82f6' : '1px solid #3b82f6',
                backgroundColor: 'transparent',
                cursor: 'move',
                zIndex: 9999,
                boxSizing: 'border-box',
                borderRadius: '0 !important',
                boxShadow: '0 0 0 9999px rgba(128, 128, 128, 0.8)',
                touchAction: 'none'
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const coords = getRelativeCoordinates(e);
                setIsMovingBox(true);
                setMoveStartPoint(coords);
                startResizeOrMove(); // Hide buttons during move
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                const coords = getRelativeCoordinates(e);
                setIsMovingBox(true);
                setMoveStartPoint(coords);
                startResizeOrMove(); // Hide buttons during move
              }}
            />
            
            {/* Resize handles */}
            {renderHandles()}
          </>
        )}
      </div>
      
      {/* Clipping controls - Always below selection, on the border line */}
      {/* Hidden during resize/move, visible after release - OVERLAY ON EVERYTHING */}
      {isClipping && selection && showButtons && (
        <div 
          style={{
            position: 'absolute',
            left: selection.x,
            top: selection.y - (isMobile ? 40 : 22),
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            zIndex: 99999,
            pointerEvents: 'auto'
          }}
        >
          <button
            className="clip-action-btn"
            onClick={handleClipConfirm}
            style={{
              padding: isMobile ? '0 12px' : '0 6px',
              height: isMobile ? '36px' : '18px',
              lineHeight: isMobile ? '36px' : '18px',
              overflow: 'visible',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              fontSize: isMobile ? '14px' : '7px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '5px' : '2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box'
            }}
          >
            <svg width={isMobile ? 16 : 10} height={isMobile ? 16 : 10} fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            Share
          </button>

          <button
            className="clip-action-btn"
            onClick={onClipCancel}
            style={{
              padding: isMobile ? '0 12px' : '0 6px',
              height: isMobile ? '36px' : '18px',
              lineHeight: isMobile ? '36px' : '18px',
              overflow: 'visible',
              backgroundColor: '#dc2626',
              color: 'white',
              border: '1px solid #b91c1c',
              borderRadius: '3px',
              fontSize: isMobile ? '14px' : '7px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '5px' : '2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box'
            }}
          >
            <svg width={isMobile ? 16 : 10} height={isMobile ? 16 : 10} fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Cancel
          </button>
        </div>
      )}
    </div>
    </>
  );
};

LazyPageViewer.displayName = 'LazyPageViewer';

export default LazyPageViewer;