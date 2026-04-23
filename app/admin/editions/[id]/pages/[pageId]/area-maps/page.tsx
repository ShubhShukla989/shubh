'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Save as SaveIcon, ChevronRight, Clipboard, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import AreaMapEditModal from './AreaMapEditModal';
import AreaMapTemplateManager from '@/components/admin/AreaMapTemplateManager';
import ResizeHandle from '@/components/admin/ResizeHandle';
import ActionIcons from '@/components/ActionIcons';

interface AreaMap {
  id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url: string;
  linked_area_ids?: number[];
  isNew?: boolean;
}

interface AvailableAreaMap {
  id: number;
  page_id: number;
  page_number: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  linked_area_ids?: number[];
}

export default function AreaMapsPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params?.id as string;
  const pageId = params?.pageId as string;

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [areaMaps, setAreaMaps] = useState<AreaMap[]>([]);
  const [imageScale, setImageScale] = useState(1); // Natural scale based on image dimensions
  const [zoom, setZoom] = useState(100); // Zoom percentage (100% default)
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());

  // Calculate the effective scale (combines natural image scale with zoom)
  const effectiveScale = imageScale * (zoom / 100);
  
  // Debug log whenever effectiveScale changes
  useEffect(() => {
    console.log('📐 EFFECTIVE SCALE CHANGED:', {
      imageScale,
      zoom,
      effectiveScale,
      calculation: `${imageScale} * (${zoom} / 100) = ${effectiveScale}`
    });
    
    if (effectiveScale <= 0 || !isFinite(effectiveScale)) {
      console.error('❌ INVALID EFFECTIVE SCALE! This will cause coordinate corruption!');
    }
    
    if (effectiveScale < 0.001) {
      console.warn('⚠️ EXTREMELY SMALL EFFECTIVE SCALE! This may cause issues.');
    }
  }, [imageScale, zoom, effectiveScale]);

  // Handle zoom change
  const handleZoomChange = (newZoom: number) => {
    console.log(`🔍 Zoom changed: ${zoom}% → ${newZoom}%`);
    console.log(`📏 Image scale: ${imageScale}, New effective scale: ${imageScale * (newZoom / 100)}`);
    setZoom(newZoom);
    // Don't modify imageScale - it should only be based on natural image dimensions
  };
  const [availableAreaMaps, setAvailableAreaMaps] = useState<AvailableAreaMap[]>([]);
  const [editingArea, setEditingArea] = useState<AreaMap | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Resize state
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  // const [resizeStart, setResizeStart] = useState<{ x: number; y: number; area: AreaMap } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRectRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use refs for drawing state to avoid re-renders
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentRectRef = useRef<AreaMap | null>(null);
  
  // Moving state
  const [movingIndex, setMovingIndex] = useState<number | null>(null);
  const moveStateRef = useRef<{
    index: number | null;
    startX: number;
    startY: number;
    originalArea: AreaMap | null;
  }>({
    index: null,
    startX: 0,
    startY: 0,
    originalArea: null
  });
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  
  // Pan/Drag state for image navigation
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStateRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0
  });
  
  // Copy/Paste state
  const [copiedAreaMaps, setCopiedAreaMaps] = useState<AreaMap[]>([]);
  const [showPasteOptions, setShowPasteOptions] = useState(false);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [showImportFromPages, setShowImportFromPages] = useState(false);
  const [showImportFullEdition, setShowImportFullEdition] = useState(false);
  const [availableEditions, setAvailableEditions] = useState<any[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  useEffect(() => {
    // Clear any existing state when pageId changes
    setAreaMaps([]);
    setEditingArea(null);
    setShowEditModal(false);
    setLoading(true);
    
    // Reset pan and zoom when changing pages
    setPanOffset({ x: 0, y: 0 });
    setZoom(100);
    
    // Fetch fresh data for new page
    fetchPage();
    fetchAreaMaps();
    fetchAvailableAreaMaps();
    fetchAllPages();
    fetchAvailableEditions();
    loadSavedTemplates();
  }, [pageId]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleResetPan();
          }
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomChange(Math.min(200, zoom + 25));
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomChange(Math.max(25, zoom - 25));
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomChange(100);
            handleResetPan();
          }
          break;
        case 'ArrowUp':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setPanOffset(prev => ({ x: prev.x, y: prev.y + 50 }));
          }
          break;
        case 'ArrowDown':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setPanOffset(prev => ({ x: prev.x, y: prev.y - 50 }));
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setPanOffset(prev => ({ x: prev.x + 50, y: prev.y }));
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setPanOffset(prev => ({ x: prev.x - 50, y: prev.y }));
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle window resize and container changes to recalculate image scale
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        const img = imageRef.current;
        if (img.naturalWidth > 0) { // Make sure image is loaded
          const newScale = img.clientWidth / img.naturalWidth;
          setImageScale(newScale);
        }
      }
    };

    // Use ResizeObserver for better detection of size changes
    let resizeObserver: ResizeObserver | null = null;
    
    if (containerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        debouncedRecalculateScale();
      });
      resizeObserver.observe(containerRef.current);
    }

    // Fallback to window resize events
    window.addEventListener('resize', debouncedRecalculateScale);
    
    // Also listen for orientation change on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(debouncedRecalculateScale, 200); // Longer delay for orientation change
    });

    // Recalculate when page becomes visible (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(debouncedRecalculateScale, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', debouncedRecalculateScale);
      window.removeEventListener('orientationchange', debouncedRecalculateScale);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear any pending debounced calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Recalculate scale when image loads or changes
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (img.naturalWidth > 0) {
      const newScale = img.clientWidth / img.naturalWidth;
      setImageScale(newScale);
      
      console.log('🖼️ Image loaded! Dimensions:', {
        natural: { width: img.naturalWidth, height: img.naturalHeight },
        display: { width: img.clientWidth, height: img.clientHeight },
        scale: newScale
      });
      
      // Re-validate area maps now that image is loaded
      if (areaMaps.length > 0) {
        console.log('🔄 Re-validating area maps after image load...');
        const validMaps = areaMaps.filter((area: AreaMap) => {
          const isValid = area.x >= 0 && area.y >= 0 && 
                         area.x + area.width <= img.naturalWidth && 
                         area.y + area.height <= img.naturalHeight;
          
          if (!isValid) {
            console.warn('❌ Area map outside bounds after image load:', {
              area: area.id,
              position: { x: area.x, y: area.y },
              size: { width: area.width, height: area.height },
              imageSize: { width: img.naturalWidth, height: img.naturalHeight }
            });
          }
          
          return isValid;
        });
        
        if (validMaps.length !== areaMaps.length) {
          console.log(`🔄 Updated area maps: ${areaMaps.length} → ${validMaps.length}`);
          setAreaMaps(validMaps);
        } else {
          console.log('✅ All area maps are valid after image load');
        }
      }
    }
  };

  // Debounced resize handler to prevent too many updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedRecalculateScale = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (imageRef.current && imageRef.current.naturalWidth > 0) {
        const img = imageRef.current;
        const newScale = img.clientWidth / img.naturalWidth;
        setImageScale(newScale);
      }
    }, 50); // 50ms debounce
  };

  const fetchAvailableAreaMaps = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/all-area-maps`, {
        cache: 'no-store'
      });
      const result = await response.json();
      if (result.success) {
        setAvailableAreaMaps(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch available area maps:', error);
    }
  };

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      if (result.success) {
        setPage(result.data);
        // Update cache key to force image refresh
        setImageCacheKey(Date.now());
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch page:', error);
      setLoading(false);
    }
  };

  const fetchAreaMaps = async () => {
    try {
      // Fix cache issue with timestamp and stronger cache headers
      const timestamp = Date.now();
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const result = await response.json();
      
      console.log('🔍 Area maps API response:', result);
      console.log('📊 Area maps count from API:', result.data?.length || 0);
      
      if (result.success) {
        const maps = result.data || [];
        console.log('✅ Raw area maps from database:', maps);
        
        console.log('✅ Valid area maps after bounds check:', maps.length);
        setAreaMaps(maps);
      } else {
        console.error('❌ API returned error:', result.error);
      }
    } catch (error) {
      console.error('💥 Failed to fetch area maps:', error);
    }
  };

  const handleSaveEditedArea = async (updatedArea: AreaMap) => {
    // Validate that the area has an ID (required for PUT request)
    if (!updatedArea.id) {
      console.error('❌ Cannot update area map: missing ID');
      alert('Error: Area map ID is missing. Please refresh and try again.');
      return;
    }

    // Save to database using the individual area map PUT endpoint
    try {
      setIsSaving(true);
      console.log('💾 Saving area map with ID:', updatedArea.id);
      console.log('🔗 Linked area IDs:', updatedArea.linked_area_ids);
      
      const response = await fetch(`/api/editions/${editionId}/area-maps/${updatedArea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedArea.title,
          url: updatedArea.url,
          linked_area_ids: updatedArea.linked_area_ids || [],
          // Don't send position/size data as those are managed separately
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Simple refresh after save
        await fetchAreaMaps();
        await fetchAvailableAreaMaps();
      } else {
        console.error('❌ Failed to save updated area map:', result.error);
        alert('Error saving changes: ' + result.error);
      }
    } catch (error) {
      console.error('💥 Save error:', error);
      alert('Error saving changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
    
    setEditingArea(null);
    setShowEditModal(false);
  };

  // Create a new clip area in the center
  const handleAddClipArea = () => {
    if (!imageRef.current) return;
    
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;
    
    // Create a box in the center (300x200 default size)
    const defaultWidth = 300;
    const defaultHeight = 200;
    
    const x = (imgWidth - defaultWidth) / 2;
    const y = (imgHeight - defaultHeight) / 2;
    
    const newArea: AreaMap = {
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      title: `Area ${areaMaps.length + 1}`,
      url: '#',
      isNew: false
    };
    
    setAreaMaps([...areaMaps, newArea]);
  };

  // Mouse down to start drawing
  const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if this is a right-click, middle-click, or holding Space key for panning
    const isPanClick = e.button === 1 || e.button === 2 || e.shiftKey;
    
    if (isPanClick) {
      // Start panning
      e.preventDefault();
      e.stopPropagation();
      
      panStateRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        initialOffsetX: panOffset.x,
        initialOffsetY: panOffset.y
      };
      
      setIsPanning(true);
      
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      document.addEventListener('contextmenu', preventContextMenu);
      
      return;
    }
    
    // Only start drawing if clicking directly on the image (not on existing boxes)
    if (e.target !== e.currentTarget && e.target !== imageRef.current) return;
    if (!imageRef.current || !containerRef.current) return;
    
    // CRITICAL FIX: Ensure image is loaded and scale is valid before drawing
    if (!imageRef.current.naturalWidth || imageRef.current.naturalWidth === 0) {
      console.error('❌ Image not loaded yet! Cannot create area map.');
      alert('Please wait for the image to load completely before creating area maps.');
      return;
    }
    
    if (imageScale <= 0 || !isFinite(imageScale)) {
      console.error('❌ Invalid imageScale:', imageScale);
      alert('Error: Invalid scale detected. Please refresh the page.');
      return;
    }
    
    // SIMPLIFIED: Use image rect directly (not container)
    const imageRect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - imageRect.left) / imageScale;
    const y = (e.clientY - imageRect.top) / imageScale;
    
    console.log('🖱️ MOUSE DOWN - Starting draw:', {
      clientX: e.clientX,
      clientY: e.clientY,
      imageLeft: imageRect.left,
      imageTop: imageRect.top,
      imageScale,
      zoom,
      effectiveScale,
      calculatedX: x,
      calculatedY: y,
      imageNaturalSize: {
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      }
    });
    
    // Check for corruption immediately
    if (x > 100000 || y > 100000 || x < -100000 || y < -100000) {
      console.error('❌ CORRUPT COORDINATES DETECTED IN MOUSE DOWN!');
      console.error('This suggests imageScale is extremely small or negative');
      alert('Error: Corrupt coordinates detected. Please check console and report this issue.');
      return;
    }
    
    isDrawingRef.current = true;
    drawStartRef.current = { x, y };
    
    currentRectRef.current = {
      x,
      y,
      width: 0,
      height: 0,
      title: `Area ${areaMaps.length + 1}`,
      url: '#',
      isNew: true
    };
    
    document.addEventListener('mousemove', handleDrawMove);
    document.addEventListener('mouseup', handleDrawEnd);
  };

  // Pan move handler
  const handlePanMove = (e: MouseEvent) => {
    if (!panStateRef.current.isPanning) return;
    
    const deltaX = e.clientX - panStateRef.current.startX;
    const deltaY = e.clientY - panStateRef.current.startY;
    
    const newOffsetX = panStateRef.current.initialOffsetX + deltaX;
    const newOffsetY = panStateRef.current.initialOffsetY + deltaY;
    
    setPanOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Pan end handler
  const handlePanEnd = () => {
    panStateRef.current.isPanning = false;
    setIsPanning(false);
    
    document.removeEventListener('mousemove', handlePanMove);
    document.removeEventListener('mouseup', handlePanEnd);
    document.removeEventListener('contextmenu', preventContextMenu);
    
    // Remove touch listeners
    document.removeEventListener('touchmove', handleTouchPanMove);
    document.removeEventListener('touchend', handleTouchPanEnd);
  };

  // Touch pan handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Two finger touch - start panning
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      panStateRef.current = {
        isPanning: true,
        startX: centerX,
        startY: centerY,
        initialOffsetX: panOffset.x,
        initialOffsetY: panOffset.y
      };
      
      setIsPanning(true);
      
      document.addEventListener('touchmove', handleTouchPanMove, { passive: false });
      document.addEventListener('touchend', handleTouchPanEnd);
    }
  };

  const handleTouchPanMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && panStateRef.current.isPanning) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      const deltaX = centerX - panStateRef.current.startX;
      const deltaY = centerY - panStateRef.current.startY;
      
      const newOffsetX = panStateRef.current.initialOffsetX + deltaX;
      const newOffsetY = panStateRef.current.initialOffsetY + deltaY;
      
      setPanOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleTouchPanEnd = () => {
    document.removeEventListener('touchmove', handleTouchPanMove);
    document.removeEventListener('touchend', handleTouchPanEnd);
    
    if (panStateRef.current.isPanning) {
      panStateRef.current.isPanning = false;
      setIsPanning(false);
    }
  };

  // Prevent context menu during panning
  const preventContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  // Reset pan position
  const handleResetPan = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDrawMove = (e: MouseEvent) => {
    if (!isDrawingRef.current || !drawStartRef.current || !containerRef.current || !imageRef.current) return;
    
    // SIMPLIFIED: Get image rect directly
    const imageRect = imageRef.current.getBoundingClientRect();
    const currentX = (e.clientX - imageRect.left) / imageScale;
    const currentY = (e.clientY - imageRect.top) / imageScale;
    
    const width = currentX - drawStartRef.current.x;
    const height = currentY - drawStartRef.current.y;
    
    currentRectRef.current = {
      x: width < 0 ? currentX : drawStartRef.current.x,
      y: height < 0 ? currentY : drawStartRef.current.y,
      width: Math.abs(width),
      height: Math.abs(height),
      title: `Area ${areaMaps.length + 1}`,
      url: '#',
      isNew: true
    };
    
    // Force re-render to show the drawing box
    if (drawingRectRef.current) {
      drawingRectRef.current.style.left = `${currentRectRef.current.x * effectiveScale}px`;
      drawingRectRef.current.style.top = `${currentRectRef.current.y * effectiveScale}px`;
      drawingRectRef.current.style.width = `${currentRectRef.current.width * effectiveScale}px`;
      drawingRectRef.current.style.height = `${currentRectRef.current.height * effectiveScale}px`;
      drawingRectRef.current.style.display = 'block';
    }
  };

  const handleDrawEnd = () => {
    // Hide drawing rectangle
    if (drawingRectRef.current) {
      drawingRectRef.current.style.display = 'none';
    }
    
    if (!isDrawingRef.current || !currentRectRef.current) {
      isDrawingRef.current = false;
      drawStartRef.current = null;
      currentRectRef.current = null;
      document.removeEventListener('mousemove', handleDrawMove);
      document.removeEventListener('mouseup', handleDrawEnd);
      return;
    }
    
    if (currentRectRef.current.width > 20 && currentRectRef.current.height > 20) {
      // Validate that area is within image bounds
      if (imageRef.current) {
        const imgWidth = imageRef.current.naturalWidth;
        const imgHeight = imageRef.current.naturalHeight;
        
        const area = { ...currentRectRef.current };
        
        console.log('🎨 DRAW END - Before clamping:', {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          imageSize: { width: imgWidth, height: imgHeight },
          effectiveScale
        });
        
        // Clamp coordinates to image bounds
        area.x = Math.max(0, Math.min(area.x, imgWidth - area.width));
        area.y = Math.max(0, Math.min(area.y, imgHeight - area.height));
        area.width = Math.min(area.width, imgWidth - area.x);
        area.height = Math.min(area.height, imgHeight - area.y);
        
        console.log('🎨 DRAW END - After clamping:', {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height
        });
        
        // Check for corruption
        if (area.x > 100000 || area.y > 100000) {
          console.error('❌ CORRUPT COORDINATES DETECTED IN DRAW END!');
        }
        
        area.isNew = false;
        setAreaMaps([...areaMaps, area]);
      } else {
        const newArea = { ...currentRectRef.current, isNew: false };
        setAreaMaps([...areaMaps, newArea]);
      }
    }
    
    isDrawingRef.current = false;
    drawStartRef.current = null;
    currentRectRef.current = null;
    
    document.removeEventListener('mousemove', handleDrawMove);
    document.removeEventListener('mouseup', handleDrawEnd);
  };

  // Handle moving an area
  const handleMoveStart = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    const area = areaMaps[index];
    moveStateRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      originalArea: { ...area }
    };
    
    setMovingIndex(index);
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', handleMoveMove);
    document.addEventListener('mouseup', handleMoveEnd);
  };

  const handleMoveMove = (e: MouseEvent) => {
    const state = moveStateRef.current;
    if (state.index === null || !state.originalArea) return;
    
    // CRITICAL FIX: Use imageScale ONLY (not effectiveScale) for natural coordinates
    const deltaX = (e.clientX - state.startX) / imageScale;
    const deltaY = (e.clientY - state.startY) / imageScale;
    
    const area = { ...state.originalArea };
    area.x += deltaX;
    area.y += deltaY;
    
    // Update area
    setAreaMaps(prevMaps => {
      const newMaps = [...prevMaps];
      newMaps[state.index!] = area;
      return newMaps;
    });
  };

  const handleMoveEnd = () => {
    const state = moveStateRef.current;
    
    // Log final position before saving to state
    if (state.index !== null) {
      const movedArea = areaMaps[state.index];
      console.log('🚚 MOVE END - Final position:', {
        index: state.index,
        x: movedArea.x,
        y: movedArea.y,
        width: movedArea.width,
        height: movedArea.height,
        effectiveScale
      });
      
      // Check for corruption
      if (movedArea.x > 100000 || movedArea.y > 100000) {
        console.error('❌ CORRUPT COORDINATES DETECTED IN MOVE END!');
      }
    }
    
    moveStateRef.current = {
      index: null,
      startX: 0,
      startY: 0,
      originalArea: null
    };
    
    setMovingIndex(null);
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleMoveMove);
    document.removeEventListener('mouseup', handleMoveEnd);
  };

  // Resize handlers - Using refs to avoid closure issues
  const resizeStateRef = useRef<{
    index: number | null;
    handle: string | null;
    startX: number;
    startY: number;
    originalArea: AreaMap | null;
  }>({
    index: null,
    handle: null,
    startX: 0,
    startY: 0,
    originalArea: null
  });

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, index: number, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Get client coordinates from either mouse or touch event
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    
    const area = areaMaps[index];
    resizeStateRef.current = {
      index,
      handle,
      startX: clientX,
      startY: clientY,
      originalArea: { ...area }
    };
    
    setResizingIndex(index);
    setResizeHandle(handle);
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    const state = resizeStateRef.current;
    if (state.index === null || !state.originalArea || !state.handle) return;
    
    // CRITICAL FIX: Use imageScale ONLY (not effectiveScale) for natural coordinates
    const deltaX = (e.clientX - state.startX) / imageScale;
    const deltaY = (e.clientY - state.startY) / imageScale;
    
    const area = { ...state.originalArea };
    const minSize = 50;
    
    // Apply resize based on handle
    switch (state.handle) {
      case 'top-left':
        area.x += deltaX;
        area.y += deltaY;
        area.width -= deltaX;
        area.height -= deltaY;
        break;
      case 'top':
        area.y += deltaY;
        area.height -= deltaY;
        break;
      case 'top-right':
        area.width += deltaX;
        area.y += deltaY;
        area.height -= deltaY;
        break;
      case 'left':
        area.x += deltaX;
        area.width -= deltaX;
        break;
      case 'right':
        area.width += deltaX;
        break;
      case 'bottom-left':
        area.x += deltaX;
        area.width -= deltaX;
        area.height += deltaY;
        break;
      case 'bottom':
        area.height += deltaY;
        break;
      case 'bottom-right':
        area.width += deltaX;
        area.height += deltaY;
        break;
    }
    
    // Enforce minimum size
    if (area.width < minSize) {
      if (state.handle.includes('left')) {
        area.x = state.originalArea.x + state.originalArea.width - minSize;
      }
      area.width = minSize;
    }
    if (area.height < minSize) {
      if (state.handle.includes('top')) {
        area.y = state.originalArea.y + state.originalArea.height - minSize;
      }
      area.height = minSize;
    }
    
    // Update area
    setAreaMaps(prevMaps => {
      const newMaps = [...prevMaps];
      newMaps[state.index!] = area;
      return newMaps;
    });
  };

  const handleResizeEnd = () => {
    const state = resizeStateRef.current;
    
    // Log final size before saving to state
    if (state.index !== null) {
      const resizedArea = areaMaps[state.index];
      console.log('📏 RESIZE END - Final size:', {
        index: state.index,
        x: resizedArea.x,
        y: resizedArea.y,
        width: resizedArea.width,
        height: resizedArea.height,
        handle: state.handle,
        effectiveScale
      });
      
      // Check for corruption
      if (resizedArea.x > 100000 || resizedArea.y > 100000 || resizedArea.width > 100000 || resizedArea.height > 100000) {
        console.error('❌ CORRUPT COORDINATES DETECTED IN RESIZE END!');
      }
    }
    
    resizeStateRef.current = {
      index: null,
      handle: null,
      startX: 0,
      startY: 0,
      originalArea: null
    };
    
    setResizingIndex(null);
    setResizeHandle(null);
    // setResizeStart(null);
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleDeleteArea = async (area: AreaMap) => {
    if (!confirm('Delete this area map? This will be saved immediately.')) {
      return;
    }
    
    // Remove from local state
    const updatedMaps = areaMaps.filter(a => a !== area);
    setAreaMaps(updatedMaps);
    
    // Save to database immediately
    try {
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaMaps: updatedMaps }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Silently saved
      } else {
        alert('Error deleting area map: ' + result.error);
        // Revert on error
        fetchAreaMaps();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete area map');
      // Revert on error
      fetchAreaMaps();
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      
      // CRITICAL DEBUG: Log what we're about to save
      console.log('🔍 ===== SAVE DEBUG START =====');
      console.log('📏 Current imageScale:', imageScale);
      console.log('🔍 Current zoom:', zoom);
      console.log('📐 Current effectiveScale:', effectiveScale);
      console.log('🖼️ Image natural dimensions:', {
        width: imageRef.current?.naturalWidth,
        height: imageRef.current?.naturalHeight
      });
      console.log('📦 Area maps being saved:', JSON.stringify(areaMaps, null, 2));
      
      // Log linked area IDs for each area
      areaMaps.forEach((area, index) => {
        console.log(`📍 Area ${index + 1}:`, {
          id: area.id,
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          title: area.title,
          linkedAreas: area.linked_area_ids
        });
        
        // Check if coordinates are corrupt
        if (area.x > 100000 || area.y > 100000 || area.width > 100000 || area.height > 100000) {
          console.error(`❌ CORRUPT COORDINATES DETECTED in Area ${index + 1}!`);
        }
      });
      console.log('🔍 ===== SAVE DEBUG END =====');
      
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaMaps }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('All area maps saved successfully with bidirectional linking!');
        
        // Simple refresh after bulk save
        await fetchAreaMaps();
        await fetchAvailableAreaMaps();
      } else {
        console.error('❌ Save failed:', result.error);
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('💥 Save error:', error);
      alert('Failed to save area maps');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch all pages for navigation and copy/paste
  const fetchAllPages = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages`);
      const result = await response.json();
      if (result.success && result.data) {
        setAllPages(result.data);
        return result.data;
      }
    } catch (error) {
      // Handle error silently
    }
    return [];
  };

  // Copy all area maps from current page
  const handleCopyAreaMaps = () => {
    if (areaMaps.length === 0) {
      alert('No area maps to copy!');
      return;
    }
    
    // Create a clean copy without IDs (so they get new IDs when pasted)
    const cleanAreaMaps = areaMaps.map(area => ({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      title: area.title,
      url: area.url,
      linked_area_ids: [], // Reset linked areas for copied maps
    }));
    
    setCopiedAreaMaps(cleanAreaMaps);
    alert(`Copied ${areaMaps.length} area maps to clipboard!`);
  };

  // Navigate to previous page
  const handlePreviousPage = async () => {
    const pages = allPages.length > 0 ? allPages : await fetchAllPages();
    const currentIndex = pages.findIndex((p: any) => p.id === parseInt(pageId));
    
    if (currentIndex > 0) {
      const prevPage = pages[currentIndex - 1];
      router.push(`/admin/editions/${editionId}/pages/${prevPage.id}/area-maps`);
    } else {
      alert('This is the first page!');
    }
  };

  // Navigate to next page
  const handleNextPage = async () => {
    const pages = allPages.length > 0 ? allPages : await fetchAllPages();
    const currentIndex = pages.findIndex((p: any) => p.id === parseInt(pageId));
    
    if (currentIndex >= 0 && currentIndex < pages.length - 1) {
      const nextPage = pages[currentIndex + 1];
      router.push(`/admin/editions/${editionId}/pages/${nextPage.id}/area-maps`);
    } else {
      alert('This is the last page!');
    }
  };

  // Paste area maps to selected pages
  const handlePasteToPages = async (targetPageIds: number[]) => {
    if (copiedAreaMaps.length === 0) {
      alert('No area maps copied! Please copy area maps first.');
      return;
    }

    // Check if any target pages already have area maps
    const pagesWithAreaMaps = targetPageIds.filter(pageId => 
      availableAreaMaps.some(area => area.page_id === pageId)
    );

    if (pagesWithAreaMaps.length > 0) {
      const pageNumbers = allPages
        .filter(p => pagesWithAreaMaps.includes(p.id))
        .map(p => p.page_number)
        .join(', ');
      
      if (!confirm(`Warning: Page(s) ${pageNumbers} already have area maps. This will replace them. Continue?`)) {
        return;
      }
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const targetPageId of targetPageIds) {
        try {
          const response = await fetch(`/api/editions/${editionId}/pages/${targetPageId}/area-maps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ areaMaps: copiedAreaMaps }),
          });
          
          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        alert(`Successfully pasted area maps to ${successCount} page(s)!${errorCount > 0 ? ` ${errorCount} failed.` : ''}`);
        setShowPasteOptions(false);
        setSelectedPages([]);
      } else {
        alert('Failed to paste area maps to any pages.');
      }
    } catch (error) {
      console.error('Paste error:', error);
      alert('Failed to paste area maps');
    }
  };

  // Paste to all pages
  const handlePasteToAllPages = async () => {
    const pages = allPages.length > 0 ? allPages : await fetchAllPages();
    const allPageIds = pages.map((p: any) => p.id).filter((id: number) => id !== parseInt(pageId));
    
    if (allPageIds.length === 0) {
      alert('No other pages found!');
      return;
    }

    if (confirm(`Paste area maps to all ${allPageIds.length} other pages?`)) {
      await handlePasteToPages(allPageIds);
    }
  };

  // Export area maps to JSON file
  const handleExportAreaMaps = () => {
    if (areaMaps.length === 0) {
      alert('No area maps to export!');
      return;
    }

    const exportData = {
      pageNumber: page.page_number,
      editionId: editionId,
      exportDate: new Date().toISOString(),
      areaMaps: areaMaps.map(area => ({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        title: area.title,
        url: area.url,
        linked_area_ids: area.linked_area_ids || []
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `area-maps-page-${page.page_number}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Exported ${areaMaps.length} area maps from page ${page.page_number}!`);
  };

  // Import area maps from JSON file
  const handleImportAreaMaps = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON file!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validate import data structure
        if (!importData.areaMaps || !Array.isArray(importData.areaMaps)) {
          alert('Invalid file format! Please select a valid area maps export file.');
          return;
        }

        // Validate each area map
        const validAreaMaps = importData.areaMaps.filter((area: any) => {
          return typeof area.x === 'number' && 
                 typeof area.y === 'number' && 
                 typeof area.width === 'number' && 
                 typeof area.height === 'number' && 
                 typeof area.title === 'string' && 
                 typeof area.url === 'string';
        });

        if (validAreaMaps.length === 0) {
          alert('No valid area maps found in the file!');
          return;
        }

        // Ask for confirmation if current page has area maps
        if (areaMaps.length > 0) {
          if (!confirm(`This page already has ${areaMaps.length} area maps. Replace them with ${validAreaMaps.length} imported area maps?`)) {
            return;
          }
        }

        // Import the area maps
        const importedAreaMaps = validAreaMaps.map((area: any, index: number) => ({
          ...area,
          isNew: true,
          id: undefined // Remove ID so new ones will be created
        }));

        setAreaMaps(importedAreaMaps);
        alert(`Successfully imported ${validAreaMaps.length} area maps!${importData.pageNumber ? ` (Originally from page ${importData.pageNumber})` : ''}\n\nDon't forget to click "Save All Area Maps" to save them.`);

      } catch (error) {
        alert('Failed to import area maps. Please check the file format.');
      }
    };

    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Import area maps from existing page
  const handleImportFromPage = async (sourcePageId: number) => {
    try {
      // Find the source page info
      const sourcePage = allPages.find(p => p.id === sourcePageId);
      const sourceAreaMaps = availableAreaMaps.filter(area => area.page_id === sourcePageId);
      
      if (sourceAreaMaps.length === 0) {
        alert('No area maps found on the selected page!');
        return;
      }

      // Ask for confirmation if current page has area maps
      if (areaMaps.length > 0) {
        if (!confirm(`This page already has ${areaMaps.length} area maps. Replace them with ${sourceAreaMaps.length} area maps from page ${sourcePage?.page_number}?`)) {
          return;
        }
      }

      // Convert available area maps to the format expected by the editor
      const importedAreaMaps = sourceAreaMaps.map((area: any) => ({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        title: area.title,
        url: area.url,
        linked_area_ids: area.linked_area_ids || [],
        isNew: true, // Mark as new so they get saved properly
        id: undefined // Remove ID so new ones will be created
      }));

      setAreaMaps(importedAreaMaps);
      setShowImportFromPages(false); // Close the import panel
      
      alert(`Successfully imported ${sourceAreaMaps.length} area maps from page ${sourcePage?.page_number}!\n\nDon't forget to click "Save All Area Maps" to save them.`);

    } catch (error) {
      alert('Failed to import area maps from the selected page.');
    }
  };

  // Fetch available editions for full edition import
  const fetchAvailableEditions = async () => {
    try {
      const response = await fetch('/api/editions');
      const result = await response.json();
      if (result.success) {
        setAvailableEditions(result.data || []);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  // Load saved templates from localStorage
  const loadSavedTemplates = () => {
    try {
      const templates = localStorage.getItem('areaMapTemplates');
      if (templates) {
        setSavedTemplates(JSON.parse(templates));
      }
    } catch (error) {
      // Handle error silently
    }
  };

  // Save templates to localStorage
  const saveTemplatesToStorage = (templates: any[]) => {
    try {
      localStorage.setItem('areaMapTemplates', JSON.stringify(templates));
      setSavedTemplates(templates);
    } catch (error) {
      console.error('Failed to save templates to storage:', error);
    }
  };

  // Import full edition area maps
  const handleImportFullEdition = async (sourceEditionId: number) => {
    try {
      // Find the source edition
      const sourceEdition = availableEditions.find(e => e.id === sourceEditionId);
      if (!sourceEdition) {
        alert('Source edition not found!');
        return;
      }

      // Fetch all pages from the source edition
      const pagesResponse = await fetch(`/api/editions/${sourceEditionId}/pages`);
      const pagesResult = await pagesResponse.json();
      
      if (!pagesResult.success || !pagesResult.data) {
        alert('Failed to fetch pages from source edition!');
        return;
      }

      const sourcePages = pagesResult.data;
      
      // Fetch all area maps from the source edition
      const areaMapsResponse = await fetch(`/api/editions/${sourceEditionId}/all-area-maps`);
      const areaMapsResult = await areaMapsResponse.json();
      
      if (!areaMapsResult.success) {
        alert('Failed to fetch area maps from source edition!');
        return;
      }

      const sourceAreaMaps = areaMapsResult.data || [];
      
      if (sourceAreaMaps.length === 0) {
        alert('No area maps found in the selected edition!');
        return;
      }

      // Group area maps by page
      const areaMapsByPage = sourceAreaMaps.reduce((acc: any, area: any) => {
        const pageId = area.page_id;
        if (!acc[pageId]) {
          acc[pageId] = [];
        }
        acc[pageId].push(area);
        return acc;
      }, {});

      // Create template data structure
      const templateData = {
        sourceEditionId,
        sourceEditionTitle: sourceEdition.title,
        sourceEditionDate: sourceEdition.date,
        totalPages: Object.keys(areaMapsByPage).length,
        totalAreaMaps: sourceAreaMaps.length,
        pages: sourcePages
          .filter((page: any) => areaMapsByPage[page.id])
          .map((page: any) => ({
            pageNumber: page.page_number,
            areaMaps: areaMapsByPage[page.id].map((area: any) => ({
              x: area.x,
              y: area.y,
              width: area.width,
              height: area.height,
              title: area.title,
              url: area.url,
              linked_area_ids: area.linked_area_ids || []
            }))
          }))
      };

      // Ask user if they want to save as template
      const templateName = prompt(`Import complete! Found ${templateData.totalAreaMaps} area maps across ${templateData.totalPages} pages.\n\nEnter a name to save this as a template (or click Cancel to skip):`);
      
      if (templateName && templateName.trim()) {
        // Save as template
        const newTemplate = {
          id: Date.now(),
          name: templateName.trim(),
          createdAt: new Date().toISOString(),
          ...templateData
        };

        const updatedTemplates = [...savedTemplates, newTemplate];
        saveTemplatesToStorage(updatedTemplates);
        
        alert(`Template "${templateName}" saved successfully!\n\nYou can now use this template to quickly apply the same area map layout to other editions.`);
      }

      // Close the import panel
      setShowImportFullEdition(false);

    } catch (error) {
      alert('Failed to import full edition area maps.');
    }
  };

  // Import from saved template
  const handleImportFromTemplate = (templateId: number) => {
    try {
      const template = savedTemplates.find(t => t.id === templateId);
      if (!template) {
        alert('Template not found!');
        return;
      }

      // Find the page in current edition that matches the template page structure
      const currentPageNumber = page.page_number;
      const templatePage = template.pages.find((p: any) => p.pageNumber === currentPageNumber);
      
      if (!templatePage) {
        alert(`No area maps found for page ${currentPageNumber} in this template!`);
        return;
      }

      // Ask for confirmation if current page has area maps
      if (areaMaps.length > 0) {
        if (!confirm(`This page already has ${areaMaps.length} area maps. Replace them with ${templatePage.areaMaps.length} area maps from template "${template.name}"?`)) {
          return;
        }
      }

      // Import the area maps
      const importedAreaMaps = templatePage.areaMaps.map((area: any) => ({
        ...area,
        isNew: true,
        id: undefined // Remove ID so new ones will be created
      }));

      setAreaMaps(importedAreaMaps);
      setShowImportFullEdition(false);
      
      alert(`Successfully imported ${importedAreaMaps.length} area maps from template "${template.name}" for page ${currentPageNumber}!\n\nDon't forget to click "Save All Area Maps" to save them.`);

    } catch (error) {
      alert('Failed to import from template.');
    }
  };

  // Delete saved template
  const handleDeleteTemplate = (templateId: number) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (!template) return;

    if (confirm(`Delete template "${template.name}"? This cannot be undone.`)) {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      saveTemplatesToStorage(updatedTemplates);
      alert(`Template "${template.name}" deleted successfully!`);
    }
  };

  // Export template to JSON file
  const handleExportTemplate = (templateId: number) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (!template) {
      alert('Template not found!');
      return;
    }

    const exportData = {
      ...template,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Area Maps Template System'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-${template.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Template "${template.name}" exported successfully!`);
  };

  // Early returns for loading and error states
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!page) {
    return <div className="p-6">Page not found</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/editions/${editionId}/pages`}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-500">
            Create Area Maps - Page {page.page_number}
          </h1>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <Link href="/admin/editions" className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          All Editions »
        </Link>
        <Link href={`/admin/editions/${editionId}/edit`} className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          Edit Edition »
        </Link>
        <Link href={`/admin/editions/${editionId}/pages`} className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          Upload/Manage Pages »
        </Link>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded">
          Edit Area Maps »
        </button>
        <Link href={`/epaper/view/${editionId}`} target="_blank" className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          View
        </Link>
      </div>

      {/* Editor Info */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="flex border-b border-gray-200">
          <button className="px-6 py-3 bg-blue-600 text-white font-medium">
            New Editor
          </button>
        </div>
        <div className="p-4 bg-blue-50">
          <p className="text-sm text-blue-800">
            This is new editor can be used on touch devices like mobile phones too.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        {/* First Row - Main Actions */}
        <div className="flex flex-wrap gap-3 mb-3">
          <button
            onClick={handleAddClipArea}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Area Map
          </button>
          <button
            onClick={handleSaveAll}
            disabled={areaMaps.length === 0 || isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <SaveIcon className="w-4 h-4" /> {isSaving ? 'Saving...' : `Save All Area Maps (${areaMaps.length})`}
          </button>
          <button
            onClick={async () => {
              if (confirm('Delete ALL area maps from this page? This cannot be undone!')) {
                try {
                  setIsSaving(true);
                  setAreaMaps([]);
                  
                  // Save empty array to database immediately
                  const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ areaMaps: [] }),
                  });
                  
                  const result = await response.json();
                  if (result.success) {
                    alert('All area maps deleted successfully!');
                    // Refresh data to ensure consistency
                    await fetchAreaMaps();
                    await fetchAvailableAreaMaps();
                  } else {
                    alert('Error deleting area maps: ' + result.error);
                    // Revert on error
                    await fetchAreaMaps();
                  }
                } catch (error) {
                  console.error('Delete all error:', error);
                  alert('Failed to delete area maps');
                  // Revert on error
                  await fetchAreaMaps();
                } finally {
                  setIsSaving(false);
                }
              }
            }}
            disabled={areaMaps.length === 0 || isSaving}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            🗑️ {isSaving ? 'Deleting...' : 'Delete All'}
          </button>

        </div>

        {/* Second Row - Navigation and Import/Export */}
        <div className="flex flex-wrap gap-3 mb-3">
          <button
            onClick={handlePreviousPage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Page
          </button>
          <button
            onClick={handleNextPage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
          >
            Next Page <ChevronRight className="w-4 h-4" />
          </button>

          {/* Template Manager */}
          <AreaMapTemplateManager
            currentPageNumber={page.page_number}
            currentAreaMaps={areaMaps}
            onImportTemplate={(importedMaps) => {
              setAreaMaps(importedMaps.map(map => ({ ...map, isNew: true })));
            }}
          />
        </div>

        {/* Third Row - Paste Options */}
        {copiedAreaMaps.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm text-gray-600 font-medium">
                📋 {copiedAreaMaps.length} area maps copied:
              </span>
              <button
                onClick={handlePasteToAllPages}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
              >
                <Clipboard className="w-4 h-4" /> Paste to All Pages
              </button>
              <button
                onClick={() => setShowPasteOptions(!showPasteOptions)}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
              >
                <Clipboard className="w-4 h-4" /> Paste to Selected Pages
              </button>
            </div>
          </div>
        )}


      </div>

      {/* Paste to Selected Pages Modal */}
      {showPasteOptions && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Select Pages to Paste Area Maps</h3>
            <div className="text-xs text-gray-600 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border border-gray-300 rounded bg-white"></span>
                No area maps
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border border-green-300 rounded bg-green-50"></span>
                Has area maps
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            {allPages
              .filter((p: any) => p.id !== parseInt(pageId)) // Exclude current page
              .map((page: any) => {
                const hasAreaMaps = availableAreaMaps.some(area => area.page_id === page.id);
                return (
                  <label
                    key={page.id}
                    className={`flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer ${
                      hasAreaMaps ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                    title={hasAreaMaps ? 'This page already has area maps' : 'This page has no area maps'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPages([...selectedPages, page.id]);
                        } else {
                          setSelectedPages(selectedPages.filter(id => id !== page.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm flex items-center gap-1">
                      Page {page.page_number}
                      {hasAreaMaps && <span className="text-green-600 text-xs">●</span>}
                    </span>
                  </label>
                );
              })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (selectedPages.length === 0) {
                  alert('Please select at least one page!');
                  return;
                }
                handlePasteToPages(selectedPages);
              }}
              disabled={selectedPages.length === 0}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
            >
              Paste to {selectedPages.length} Selected Page{selectedPages.length !== 1 ? 's' : ''}
            </button>
            <button
              onClick={() => {
                const otherPageIds = allPages
                  .filter((p: any) => p.id !== parseInt(pageId))
                  .map((p: any) => p.id);
                setSelectedPages(otherPageIds);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-100 text-sm font-medium"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedPages([])}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-100 text-sm font-medium"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowPasteOptions(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image Canvas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            <strong>Instructions:</strong> Hold mouse to drag and create boxes. Click and drag the box to move it. Use corner/edge handles to resize.
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            <strong>Navigation:</strong> Right-click + drag OR Shift + left-click + drag to pan around the image. On touch devices, use two fingers to pan. Use zoom controls to zoom in/out.
          </p>
          <details className="mt-2">
            <summary className="text-sm text-yellow-800 cursor-pointer hover:text-yellow-900">
              <strong>Keyboard Shortcuts</strong> (click to expand)
            </summary>
            <div className="mt-2 text-xs text-yellow-700 grid grid-cols-2 gap-2">
              <div><kbd className="bg-yellow-200 px-1 rounded">Ctrl/Cmd + Plus</kbd> - Zoom In</div>
              <div><kbd className="bg-yellow-200 px-1 rounded">Ctrl/Cmd + Minus</kbd> - Zoom Out</div>
              <div><kbd className="bg-yellow-200 px-1 rounded">Ctrl/Cmd + 0</kbd> - Reset Zoom & Pan</div>
              <div><kbd className="bg-yellow-200 px-1 rounded">Ctrl/Cmd + R</kbd> - Reset Pan</div>
              <div><kbd className="bg-yellow-200 px-1 rounded">Ctrl/Cmd + Arrows</kbd> - Pan Direction</div>
              <div><kbd className="bg-yellow-200 px-1 rounded">Right Click + Drag</kbd> - Pan Image</div>
              <div><kbd className="bg-yellow-200 px-1 rounded">Shift + Drag</kbd> - Pan Image</div>
              <div><kbd className="bg-yellow-200 px-1 rounded">Two Finger Drag</kbd> - Pan (Touch)</div>
            </div>
          </details>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
            <span>Natural Scale: {(imageScale * 100).toFixed(1)}%</span>
            <span>Zoom: {zoom}%</span>
            <span>Effective Scale: {(effectiveScale * 100).toFixed(1)}%</span>
            <span>Pan: ({panOffset.x.toFixed(0)}, {panOffset.y.toFixed(0)})</span>
          </div>
        </div>
        
        <div
          ref={containerRef}
          className="relative border-2 border-gray-300 rounded overflow-hidden"
          style={{ 
            userSelect: 'none',
            cursor: isPanning ? 'grabbing' : 'crosshair',
            touchAction: 'none' // Prevent default touch behaviors
          }}
          onMouseDown={handleImageMouseDown}
          onTouchStart={handleTouchStart}
          onContextMenu={(e) => e.preventDefault()} // Prevent context menu
        >
          <div 
            className="relative"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <img
              ref={imageRef}
              src={`${page.image_url}${page.image_url.includes('?') ? '&' : '?'}v=${imageCacheKey}`}
              alt={`Page ${page.page_number}`}
              className="w-full h-auto"
              onLoad={handleImageLoad}
              onError={(e) => {
                console.error('Failed to load page image:', page.image_url);
              }}
              draggable={false}
              key={`area-map-image-${imageCacheKey}`}
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
                width: '100%'
              }}
            />
          </div>

          {/* Pan Mode Indicator */}
          {isPanning && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium z-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Pan Mode Active
            </div>
          )}

          {/* Zoom Control - Bottom Right Corner */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-3 shadow-lg z-50">
            <div className="flex flex-col items-center gap-2 min-w-[200px]">
              <div className="text-sm font-medium text-gray-700">Zoom Control</div>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => handleZoomChange(Math.max(25, zoom - 25))}
                  className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-lg font-bold"
                  title="Zoom Out"
                >
                  −
                </button>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="25"
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - 25) / (200 - 25)) * 100}%, #e5e7eb ${((zoom - 25) / (200 - 25)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md pointer-events-none"
                    style={{
                      left: `calc(${((zoom - 25) / (200 - 25)) * 100}% - 8px)`
                    }}
                  />
                </div>
                <button
                  onClick={() => handleZoomChange(Math.min(200, zoom + 25))}
                  className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center text-lg font-bold"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
              <div className="text-xs text-center text-gray-600 mt-1">
                {zoom}%
              </div>
              
              {/* Pan Controls */}
              <div className="border-t pt-2 mt-2 w-full">
                <div className="text-sm font-medium text-gray-700 text-center mb-2">Pan Control</div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleResetPan}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-medium"
                    title="Reset Pan Position"
                  >
                    Reset Pan
                  </button>
                  <div className="text-xs text-gray-600">
                    ({panOffset.x.toFixed(0)}, {panOffset.y.toFixed(0)})
                  </div>
                </div>
                <div className="text-xs text-center text-gray-500 mt-1">
                  Right-click + drag or Shift + drag to pan
                </div>
              </div>
            </div>
          </div>
          
          {/* Drawing rectangle - shown while creating new box */}
          <div
            ref={drawingRectRef}
            className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{ display: 'none' }}
          />
          
          {/* Render existing area maps */}
          {areaMaps.map((area, index) => (
            <div
              key={index}
              className="absolute group area-map-box"
              style={{
                // Fix: Add pan offset to area map position so they move with the image
                left: `${(area.x * effectiveScale) + panOffset.x}px`,
                top: `${(area.y * effectiveScale) + panOffset.y}px`,
                width: `${area.width * effectiveScale}px`,
                height: `${area.height * effectiveScale}px`,
                zIndex: showEditModal ? 10 : 20, // Lower z-index when modal is open
              }}
            >
              {/* Area Rectangle - Click and drag to move */}
              <div 
                className="w-full h-full border-2 border-red-500 bg-red-500/20 hover:bg-red-500/30 cursor-move transition-colors duration-200"
                onMouseDown={(e) => handleMoveStart(e, index)}
              >
                {/* Area number - top right */}
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 pointer-events-none">
                  {index + 1}
                </div>
                
                {/* Action Icons - top left, always visible */}
                <div className="absolute top-1 left-1 flex gap-1 z-10">
                  {/* Green Edit Icon */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      
                      // Prevent editing while saving or loading
                      if (isSaving || loading) {
                        return;
                      }
                      
                      // Fetch latest available area maps before opening modal
                      try {
                        const response = await fetch(`/api/editions/${editionId}/all-area-maps`, {
                          cache: 'no-store',
                          headers: {
                            'Cache-Control': 'no-cache',
                          },
                        });
                        const result = await response.json();
                        if (result.success) {
                          setAvailableAreaMaps(result.data || []);
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }
                      } catch (error) {
                        // Handle error silently
                      }
                      setEditingArea(area);
                      setShowEditModal(true);
                    }}
                    disabled={isSaving || loading}
                    className={`w-6 h-6 rounded flex items-center justify-center shadow-md transition-colors ${
                      isSaving || loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    title={isSaving || loading ? "Please wait..." : "Edit"}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  {/* Blue Save Icon */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        setIsSaving(true);
                        const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ areaMaps }),
                        });
                        const result = await response.json();
                        if (result.success) {
                          alert('Area map saved successfully!');
                          
                          // Simple refresh after save
                          fetchAreaMaps();
                          fetchAvailableAreaMaps();
                        } else {
                          alert('Error: ' + result.error);
                        }
                      } catch (error) {
                        alert('Failed to save area map');
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center shadow-md transition-colors"
                    title="Save"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  
                  {/* Red Delete Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteArea(area);
                    }}
                    className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded flex items-center justify-center shadow-md transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Resize Handles - Always visible, 8 square boxes */}
              <div>
                <ResizeHandle position="top-left" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="top" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="top-right" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="left" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="right" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="bottom-left" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="bottom" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="bottom-right" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
              </div>
            </div>
          ))}
          

        </div>
      </div>



      {/* Area Maps List */}
      {areaMaps.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold mb-3">Area Maps ({areaMaps.length})</h3>
          <div className="space-y-3">
            {areaMaps.map((area, index) => (
              <div key={index} id={`area-${index}`} className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">Area {index + 1}</span>
                  <ActionIcons.Delete
                    onClick={() => handleDeleteArea(area)}
                    title="Delete"
                    className="!p-1"
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={area.title}
                      onChange={(e) => {
                        const newMaps = [...areaMaps];
                        newMaps[index] = { ...area, title: e.target.value };
                        setAreaMaps(newMaps);
                      }}
                      className="w-full px-2 py-1 text-sm border rounded"
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
                    <input
                      type="text"
                      value={area.url}
                      onChange={(e) => {
                        const newMaps = [...areaMaps];
                        newMaps[index] = { ...area, url: e.target.value };
                        setAreaMaps(newMaps);
                      }}
                      className="w-full px-2 py-1 text-sm border rounded"
                      placeholder="Enter URL"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingArea && (
        <AreaMapEditModal
          key={`${editingArea.id}-${JSON.stringify(editingArea.linked_area_ids)}`}
          area={editingArea}
          availableAreaMaps={availableAreaMaps}
          currentPageId={pageId}
          onSave={handleSaveEditedArea}
          onClose={() => {
            setShowEditModal(false);
            setEditingArea(null);
          }}
        />
      )}
    </div>
  );
}
