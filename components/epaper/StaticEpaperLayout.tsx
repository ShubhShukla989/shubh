'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LazyPageViewer from './LazyPageViewer';
import ShareModal from './ShareModal';
import CalendarModal from './CalendarModal';
import { DottedCircleLoader } from '@/components/ui/DottedCircleLoader';
import { shareOnWhatsApp } from '@/lib/whatsappShare';

// Custom scrollbar styles
const scrollbarStyles = `
  .thumbnail-scrollbar::-webkit-scrollbar {
    width: 20px;
  }
  
  .thumbnail-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .thumbnail-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    width: 16px;
  }
  
  .thumbnail-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  .thumbnail-scrollbar {
    scrollbar-width: auto;
    scrollbar-color: #c1c1c1 #f1f1f1;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface Page {
  id: number;
  page_number: number;
  image_url: string;
  thumb_url?: string;
  title?: string;
}

interface Edition {
  id: number;
  pdf_url?: string;
  title: string;
  created_at?: string;
  date?: string; // Publication date set by admin
  category_id?: number;
}

interface AreaMap {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  content?: string;
  page_number: number;
  url?: string;
  linked_area_ids?: number[];
  page_id?: number;
  watermarked_image_url?: string; // Pre-generated watermarked image URL
  combined_image_url?: string; // Pre-generated combined image URL (for linked areas)
}

interface WatermarkSettings {
  enable_watermarking: boolean;
  logo_url: string;
  logo_width_percentage: number;
  opacity: number;
  mode: string;
  position: string;
  min_width_px: number;
  background_color: string;
  foreground_color: string;
  enable_border: boolean;
  border_width: number;
  border_color: string;
  info_text: string;
  info_text_font: string;
  enable_center_watermark: boolean;
  center_watermark_url: string;
  center_watermark_opacity: number;
}

interface StaticEpaperLayoutProps {
  editionId?: string;
  initialData?: {
    edition: any;
    pages: any[];
    areaMaps: any[];
    watermarkSettings: any;
  };
}

export function StaticEpaperLayout({ editionId: propEditionId, initialData }: StaticEpaperLayoutProps) {
  const params = useParams();
  const router = useRouter();
  const editionId = propEditionId || (params?.editionId as string);
  
  const [pages, setPages] = useState<Page[]>(initialData?.pages || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(!initialData);
  const [edition, setEdition] = useState<Edition | null>(initialData?.edition || null);
  const [isClipping, setIsClipping] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [clippedImage, setClippedImage] = useState<string | null>(null);
  const [savedClipData, setSavedClipData] = useState<{ id: string | number; image_url: string; clip_url: string } | null>(null);
  const [isPreparingClip, setIsPreparingClip] = useState(false); // Loading state for clip preparation
  const [areaMaps, setAreaMaps] = useState<AreaMap[]>(initialData?.areaMaps || []);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaMap | null>(null);
  const [currentAreaIndex, setCurrentAreaIndex] = useState<number>(0);
  const [modalWatermarkedImage, setModalWatermarkedImage] = useState<string>('');
  const [modalImageLoading, setModalImageLoading] = useState<boolean>(false);
  const [modalImageLoaded, setModalImageLoaded] = useState<boolean>(false);
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings | null>(initialData?.watermarkSettings || null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  // FIX #6: Synchronous init avoids hydration layout shift
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [isClient, setIsClient] = useState(false);
  const [titleWidth, setTitleWidth] = useState(250);

  // Simple zoom functionality for area modal (single click toggle with scrollbars)
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 0, y: 0 }); // Top-left origin for zoom

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Get current page data
  const currentPageData = pages.find(p => p.page_number === currentPage);

  // Hydration-safe mobile detection + title width â€” single resize listener
  useEffect(() => {
    setIsClient(true);

    const updateLayout = () => {
      setIsMobile(window.innerWidth <= 768);
      const titleElement = document.getElementById('page-title');
      if (titleElement) {
        setTitleWidth(Math.min(titleElement.offsetWidth, window.innerWidth * 0.8));
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [edition, currentPage]);

  // Listen for calendar request from footer bar
  useEffect(() => {
    const handleCalendarRequest = () => {
      handleArchiveClick();
    };

    window.addEventListener('calendarrequest', handleCalendarRequest);
    
    return () => {
      window.removeEventListener('calendarrequest', handleCalendarRequest);
    };
  }, []);

  // Auto-scroll active thumbnail to viewport center
  useEffect(() => {
    if (thumbnailContainerRef.current && pages.length > 0 && !isMobile) {
      const container = thumbnailContainerRef.current;
      const activeIndex = pages.findIndex(p => p.page_number === currentPage);
      
      if (activeIndex !== -1) {
        requestAnimationFrame(() => {
          const thumbnailElements = container.querySelectorAll('[data-page-number]');
          const activeThumbnail = thumbnailElements[activeIndex] as HTMLElement;
          
          if (activeThumbnail) {
            const thumbnailTop = activeThumbnail.offsetTop;
            const thumbnailHeight = activeThumbnail.offsetHeight;
            const containerHeight = container.clientHeight;
            
            const scrollTop = thumbnailTop - (containerHeight / 2) + (thumbnailHeight / 2);
            
            container.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            });
          }
        });
      }
    }
  }, [currentPage, pages, isMobile]);
  // Fetch all data when component mounts (only if no initial data)
  useEffect(() => {
    if (editionId && !initialData) {
      fetchAllData();
      
      // Set initial page from URL
      const urlParams = new URLSearchParams(window.location.search);
      const pageNum = parseInt(urlParams.get('page') || '1');
      setCurrentPage(pageNum);
    } else if (initialData) {
      // If we have initial data, just set the page from URL
      const urlParams = new URLSearchParams(window.location.search);
      const pageNum = parseInt(urlParams.get('page') || '1');
      setCurrentPage(pageNum);
      setLoading(false);
    }
  }, [editionId, initialData]);

  // Refetch watermark settings on window focus to pick up any admin changes
  const watermarkSettingsFetchedAt = useRef<number>(0);
  useEffect(() => {
    const handleWindowFocus = () => {
      if (editionId) {
        watermarkSettingsFetchedAt.current = Date.now();
        fetchWatermarkSettings();
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [editionId]);

  // FIX #4: Pre-warm watermarks for current page areas silently in background
  useEffect(() => {
    if (areaMaps.length === 0) return;
    const unwarm = areaMaps.filter(
      a => a.page_number === currentPage && !a.watermarked_image_url && !a.combined_image_url
    );
    unwarm.forEach(area => {
      fetch(`/api/area-maps/${area.id}/watermark`, { method: 'POST' })
        .then(r => r.json())
        .then(result => {
          if (result?.success && result.data) {
            setAreaMaps(prev => prev.map(a =>
              a.id === area.id ? { ...a, ...result.data } : a
            ));
          }
        })
        .catch(() => {});
    });
  }, [currentPage, areaMaps.length]);

  // Fetch all data when component mounts (only if no initial data)
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/editions/${editionId}/complete`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch edition data');
      const { edition, pages, areaMaps, watermarkSettings } = data.data;
      setEdition(edition);
      setPages(pages || []);
      setAreaMaps(areaMaps || []);
      setWatermarkSettings(watermarkSettings);
    } catch (error) {
      console.error('Failed to fetch edition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatermarkSettings = async (): Promise<WatermarkSettings | null> => {
    try {
      // Try category-specific settings first if edition has a category
      const categoryId = edition?.category_id;
      if (categoryId) {
        const catRes = await fetch(`/api/settings/category-watermark?category_id=${categoryId}`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.success && catData.data?.override_global_settings) {
            setWatermarkSettings(catData.data);
            return catData.data;
          }
        }
      }

      // Fall back to global settings
      const response = await fetch(`/api/settings/area-map-watermark`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setWatermarkSettings(data.data);
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch watermark settings:', error);
      return null;
    }
  };

  // Navigation functions
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  // PDF Download functionality
  const handleDownloadPDF = () => {
    if (edition?.pdf_url) {
      window.open(edition.pdf_url, '_blank');
    } else {
      alert('PDF not available for this edition');
    }
  };

  // Clip functionality
  const handleClip = () => {
    const newClippingState = !isClipping;
    setIsClipping(newClippingState);
    
    window.dispatchEvent(new CustomEvent('clippingchange', { 
      detail: { isClipping: newClippingState } 
    }));
  };

  const handleClipComplete = async (imageBlob: Blob) => {
    setIsClipping(false);
    setIsPreparingClip(true);

    try {
      const clipData = await saveClipToDatabase(imageBlob);
      if (clipData) {
        setClippedImage(clipData.image_url);
        setSavedClipData({ id: clipData.id, image_url: clipData.image_url, clip_url: clipData.clip_url });
        setShowShareModal(true);
      } else {
        throw new Error('Failed to save clip');
      }
    } catch (error) {
      console.error('Error preparing clip:', error);
      alert('Failed to prepare clip. Please try again.');
    } finally {
      setIsPreparingClip(false);
    }
  };

  // Save clip to database via FormData (server expects multipart/form-data)
  const saveClipToDatabase = async (imageBlob: Blob): Promise<any> => {
    try {
      const form = new FormData();
      form.append('image', imageBlob, 'clip.webp');
      form.append('edition_id', String(parseInt(editionId || '0')));
      form.append('page_number', String(currentPage));

      const response = await fetch('/api/clips/save', {
        method: 'POST',
        body: form,
      });

      const result = await response.json();
      if (result.success && result.data) return result.data;
      return null;
    } catch (error) {
      console.error('Error saving clip:', error);
      return null;
    }
  };

  const handleClipCancel = () => {
    setIsClipping(false);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setClippedImage(null);
    setSavedClipData(null);
  };

  // Handle area click to open modal with ON-DEMAND watermark generation (lazy-loading cache system)
  // Handle area click to open modal with ON-DEMAND watermark generation (lazy-loading cache system)
  const handleAreaClick = async (area: AreaMap) => {
    // IMPROVEMENT 1: Prevent rapid clicks (disable while processing)
    if (modalImageLoading) {
      console.log('âš ï¸ Already processing, please wait...');
      return;
    }

    // Get current page area maps and find the index of clicked area
    const currentPageAreas = areaMaps.filter(a => a.page_number === currentPage);
    const areaIndex = currentPageAreas.findIndex(a => a.id === area.id);
    
    setSelectedArea(area);
    setCurrentAreaIndex(areaIndex);
    setModalWatermarkedImage(''); // Clear for instant update
    setModalImageLoading(true); // Start loading
    setModalImageLoaded(false); // Reset loaded state
    setShowAreaModal(true); // Open modal immediately
    
    // âœ… ON-DEMAND GENERATION: Check cache first, generate if needed
    const imageUrl = area.combined_image_url || area.watermarked_image_url;
    
    if (imageUrl) {
      // Cache HIT - Image already exists (50ms)
      console.log(`âœ… Cache HIT - Serving existing watermark for area ${area.id}`);
      setModalWatermarkedImage(imageUrl);
    } else {
      // Cache MISS - Generate now (800ms first time)
      console.log(`â³ Cache MISS - Generating watermark for area ${area.id}...`);
      
      // IMPROVEMENT 2: Enhanced error handling with try-catch
      try {
        const response = await fetch(`/api/area-maps/${area.id}/watermark`, {
          method: 'POST'
        });
        
        // IMPROVEMENT 3: Check response status
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const url = result.data.combined_image_url || result.data.watermarked_image_url;
          
          if (url) {
            console.log(`âœ… Watermark ${result.cached ? 'served from cache' : 'generated'} for area ${area.id}`);
            setModalWatermarkedImage(url);
            
            // Update local areaMaps state so next click is instant
            setAreaMaps(prev => prev.map(a => 
              a.id === area.id 
                ? { ...a, watermarked_image_url: result.data.watermarked_image_url, combined_image_url: result.data.combined_image_url }
                : a
            ));
          } else {
            throw new Error('No image URL in response');
          }
        } else {
          throw new Error(result.error || 'Failed to generate watermark');
        }
      } catch (error) {
        // IMPROVEMENT 4: Better error handling with user-friendly messages
        console.error('Failed to generate watermark:', error);
        setModalImageLoading(false);
        setShowAreaModal(false); // Close modal on error
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to load area map: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
      }
    }
  };

  // FIX #5: Skip canvas — pass image URL directly to modal
  const handleFullPageClick = async () => {
    if (!currentPageData) return;
    setSelectedArea({ id: 0, x: 0, y: 0, width: 1000, height: 1000, title: `Page ${currentPage}`, page_number: currentPage });
    setModalWatermarkedImage(currentPageData.image_url);
    setModalImageLoading(false);
    setModalImageLoaded(true);
    setShowAreaModal(true);
  };

  // Close area modal and save watermarked image to DB
  const handleCloseAreaModal = async () => {
    // Save watermarked image to DB before closing (if available)
    if (selectedArea && modalWatermarkedImage && selectedArea.id !== 0) {
      try {
        await fetch(`/api/area-maps/${selectedArea.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            watermarked_image_url: modalWatermarkedImage
          })
        });
      } catch (error) {
        console.error('Failed to save watermarked image:', error);
      }
    }
    
    setShowAreaModal(false);
    setSelectedArea(null);
    setModalImageLoading(false);
    setModalImageLoaded(false);
    
    // Reset zoom state
    setIsZoomed(false);
    setZoomOrigin({ x: 0, y: 0 }); // Reset to top-left
    
    // IMPROVEMENT 5: Enhanced memory cleanup to prevent leaks
    if (modalWatermarkedImage) {
      // Only revoke if it's a blob URL (starts with 'blob:')
      if (modalWatermarkedImage.startsWith('blob:')) {
        URL.revokeObjectURL(modalWatermarkedImage);
      }
      setModalWatermarkedImage('');
    }
    
    // Force garbage collection hint (browser decides)
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc();
      } catch (e) {
        // Ignore - gc() not available in production
      }
    }
  };

  // Area navigation functions - Use ON-DEMAND generation with cache
  const handlePreviousArea = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentPageAreas = areaMaps.filter(a => a.page_number === currentPage);
    if (currentAreaIndex > 0) {
      const newIndex = currentAreaIndex - 1;
      const newArea = currentPageAreas[newIndex];
      
      // Reset zoom state when navigating
      setIsZoomed(false);
      setZoomOrigin({ x: 0, y: 0 });
      
      setCurrentAreaIndex(newIndex);
      setSelectedArea(newArea);
      setModalImageLoading(true);
      setModalImageLoaded(false);
      
      // Check cache first
      const imageUrl = newArea.combined_image_url || newArea.watermarked_image_url;
      
      if (imageUrl) {
        // Cache HIT
        setModalWatermarkedImage(imageUrl);
      } else {
        // Cache MISS - Generate on-demand
        try {
          const response = await fetch(`/api/area-maps/${newArea.id}/watermark`, {
            method: 'POST'
          });
          
          const result = await response.json();
          
          if (result.success && result.data) {
            const url = result.data.combined_image_url || result.data.watermarked_image_url;
            if (url) {
              setModalWatermarkedImage(url);
              
              // Update cache
              setAreaMaps(prev => prev.map(a => 
                a.id === newArea.id 
                  ? { ...a, watermarked_image_url: result.data.watermarked_image_url, combined_image_url: result.data.combined_image_url }
                  : a
              ));
            }
          }
        } catch (error) {
          console.error('Failed to generate watermark:', error);
        }
      }
    }
  };

  const handleNextArea = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentPageAreas = areaMaps.filter(a => a.page_number === currentPage);
    if (currentAreaIndex < currentPageAreas.length - 1) {
      const newIndex = currentAreaIndex + 1;
      const newArea = currentPageAreas[newIndex];
      
      // Reset zoom state when navigating
      setIsZoomed(false);
      setZoomOrigin({ x: 0, y: 0 });
      
      setCurrentAreaIndex(newIndex);
      setSelectedArea(newArea);
      setModalImageLoading(true);
      setModalImageLoaded(false);
      
      // Check cache first
      const imageUrl = newArea.combined_image_url || newArea.watermarked_image_url;
      
      if (imageUrl) {
        // Cache HIT
        setModalWatermarkedImage(imageUrl);
      } else {
        // Cache MISS - Generate on-demand
        try {
          const response = await fetch(`/api/area-maps/${newArea.id}/watermark`, {
            method: 'POST'
          });
          
          const result = await response.json();
          
          if (result.success && result.data) {
            const url = result.data.combined_image_url || result.data.watermarked_image_url;
            if (url) {
              setModalWatermarkedImage(url);
              
              // Update cache
              setAreaMaps(prev => prev.map(a => 
                a.id === newArea.id 
                  ? { ...a, watermarked_image_url: result.data.watermarked_image_url, combined_image_url: result.data.combined_image_url }
                  : a
              ));
            }
          }
        } catch (error) {
          console.error('Failed to generate watermark:', error);
        }
      }
    }
  };

  // Simple zoom toggle handler for area modal (single click)
  // Zoom expands from top-left to avoid overlapping share icons
  const handleAreaImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // Always zoom from top-left corner (0%, 0%)
    // This makes image expand to bottom and right only
    setZoomOrigin({ x: 0, y: 0 });
    
    // Toggle zoom
    setIsZoomed(!isZoomed);
  };

  // Archive functionality
  const handleArchiveClick = () => {
    setShowCalendarModal(true);
  };

  const handleCloseCalendarModal = () => {
    setShowCalendarModal(false);
  };

  // Remove the loading screen - let content load progressively

  const visibleThumbnails = pages;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div style={{ 
        width: '100%', 
        minHeight: isMobile ? 'fit-content' : '100vh',
        backgroundColor: '#e5e7eb',
        fontFamily: 'Arial, sans-serif',
        paddingBottom: isMobile ? '0' : 'auto',
        overflow: 'visible'
      }}>
      
      {/* Centered Content Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        minHeight: isMobile ? 'fit-content' : '100vh',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
        paddingBottom: isMobile ? '0' : 'auto',
        overflow: 'visible'
      }}>

        {/* Desktop Controls Bar */}
        {!isMobile && (
          <div style={{ 
            width: '100%', 
            backgroundColor: '#ffffff', 
            borderBottom: '1px solid #d1d5db',
            padding: '10px 16px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            
            {/* Left side - Page Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  minWidth: '90px',
                  outline: 'none',
                  borderRadius: '3px'
                }}
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.page_number}>
                    Page {page.page_number}
                  </option>
                ))}
              </select>

              {/* Page Number Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    height: '36px',
                    width: '36px',
                    backgroundColor: '#ffffff',
                    color: currentPage === 1 ? '#9ca3af' : '#dc2626',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Double Left Triangle << */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderRight: `7px solid ${currentPage === 1 ? '#9ca3af' : '#dc2626'}`
                    }}></div>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderRight: `7px solid ${currentPage === 1 ? '#9ca3af' : '#dc2626'}`
                    }}></div>
                  </div>
                </button>

                {/* Current page and nearby pages */}
                {(() => {
                  const getPageNumbers = (current: number, total: number): number[] => {
                    if (total <= 5) {
                      return Array.from({ length: total }, (_, i) => i + 1);
                    }
                    
                    let start = current - 2;
                    let end = current + 2;
                    
                    if (start < 1) {
                      const offset = 1 - start;
                      start = 1;
                      end = Math.min(total, end + offset);
                    }
                    
                    if (end > total) {
                      const offset = end - total;
                      end = total;
                      start = Math.max(1, start - offset);
                    }
                    
                    const pageNumbers: number[] = [];
                    for (let i = start; i <= end; i++) {
                      pageNumbers.push(i);
                    }
                    
                    return pageNumbers;
                  };

                  const pageNumbers = getPageNumbers(currentPage, pages.length);
                  
                  return pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      style={{
                        height: '36px',
                        width: '36px',
                        backgroundColor: pageNum === currentPage ? '#dc2626' : '#ffffff',
                        color: pageNum === currentPage ? '#ffffff' : '#dc2626',
                        border: '2px solid #e5e7eb',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        borderRadius: '0px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {pageNum}
                    </button>
                  ));
                })()}

                <button
                  onClick={() => goToPage(Math.min(pages.length, currentPage + 1))}
                  disabled={currentPage === pages.length}
                  style={{
                    height: '36px',
                    width: '36px',
                    backgroundColor: '#ffffff',
                    color: currentPage === pages.length ? '#9ca3af' : '#dc2626',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: currentPage === pages.length ? 'not-allowed' : 'pointer',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Double Right Triangle >> */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: `7px solid ${currentPage === pages.length ? '#9ca3af' : '#dc2626'}`
                    }}></div>
                    <div style={{
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: `7px solid ${currentPage === pages.length ? '#9ca3af' : '#dc2626'}`
                    }}></div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right side - Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleDownloadPDF}
                disabled={!edition?.pdf_url}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: '#fd7e14',
                  color: '#ffffff',
                  border: '1px solid #fd7e14',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: edition?.pdf_url ? 'pointer' : 'not-allowed',
                  opacity: edition?.pdf_url ? 1 : 0.6,
                  borderRadius: '0px'
                }}
                title={edition?.pdf_url ? 'Download PDF' : 'PDF not available'}
              >
                PDF
              </button>
              <button
                onClick={handleClip}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  backgroundColor: '#0d6efd',
                  color: '#ffffff',
                  border: '1px solid #0d6efd',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={isClipping ? 'Stop Clipping' : 'Start Clipping'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm0 12c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z" fill="currentColor" strokeWidth="0.5" stroke="currentColor"/>
                </svg>
                <span style={{ fontWeight: '700' }}>Clip</span>
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={handleArchiveClick}
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    backgroundColor: '#dc3545',
                    color: '#ffffff',
                    border: '1px solid #dc3545',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Archive"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor" strokeWidth="0.5" stroke="currentColor"/>
                  </svg>
                  <span style={{ fontWeight: '700' }}>Archive</span>
                </button>
                
                {/* Calendar Modal - Position below this button (Desktop only) */}
                {showCalendarModal && !isMobile && (
                  <div style={{ 
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    zIndex: 10002
                  }}>
                    <CalendarModal
                      onClose={handleCloseCalendarModal}
                      categoryId={edition?.category_id}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Main Layout Container */}
        <div style={{ display: 'flex', width: '100%', overflow: 'visible' }}> 
          
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div style={{ 
              width: '180px',
              backgroundColor: '#ffffff', 
              borderRight: '1px solid #dee2e6',
              height: '150vh',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <div 
                ref={thumbnailContainerRef}
                className="thumbnail-scrollbar"
                style={{ 
                  padding: '16px 12px',
                  height: '100%',
                  overflowY: 'auto'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {visibleThumbnails.map((page) => {
                    const isActive = currentPage === page.page_number;
                    
                    return (
                      <div
                        key={page.id}
                        data-page-number={page.page_number}
                        style={{
                          width: '100%',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          boxShadow: isActive 
                            ? '0 4px 12px rgba(220, 53, 69, 0.3), 0 2px 4px rgba(220, 53, 69, 0.2)' 
                            : '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                          transition: 'all 0.2s',
                          padding: '4px',
                          borderRadius: '0px',
                          border: isActive ? '2px solid #dc2626' : '2px solid #fca5a5',
                          position: 'relative',
                          marginBottom: '24px'
                        }}
                        onClick={() => goToPage(page.page_number)}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.border = '2px solid #dc2626';
                          }
                          
                          const textElement = e.currentTarget.querySelector('.page-text') as HTMLElement;
                          if (textElement && !isActive) {
                            textElement.style.textDecoration = 'underline';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.border = '2px solid #fca5a5';
                            
                            const textElement = e.currentTarget.querySelector('.page-text') as HTMLElement;
                            if (textElement) {
                              textElement.style.textDecoration = 'none';
                            }
                          }
                        }}
                      >
                        {/* Thumbnail Image - Use thumb_url if available, else image_url */}
                        <div style={{ 
                          width: '100%',
                          height: '0',
                          paddingBottom: '140%',
                          backgroundColor: '#f8f9fa',
                          overflow: 'hidden',
                          position: 'relative',
                          borderRadius: '0px'
                        }}>
                          <img
                            src={(page as any).thumb_url_with_cache_bust || (page as any).thumb_url || (page as any).image_url_with_cache_bust || page.image_url}
                            alt={`Page ${page.page_number}`}
                            loading="lazy"
                            decoding="async"
                            style={{ 
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover'
                            }}

                          />
                        </div>
                        
                        {/* Page Label */}
                        <div style={{ 
                          position: 'absolute',
                          bottom: '-20px',
                          left: '0',
                          right: '0',
                          textAlign: 'center',
                          backgroundColor: 'transparent'
                        }}>
                          <div 
                            className="page-text"
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#dc2626',
                              textDecoration: isActive ? 'underline' : 'none',
                              display: 'inline-block'
                            }}
                          >
                            Page {page.page_number}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Right Content Area */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: !isMobile ? '2px 0 4px rgba(0, 0, 0, 0.1), -2px 0 4px rgba(0, 0, 0, 0.1)' : 'none',
            marginBottom: isMobile ? '0' : '60px',
            minHeight: isMobile ? 'fit-content' : '100vh',
            position: 'relative'
          }}>
            
            {/* Page Header */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              borderBottom: 'none',
              padding: '16px 20px 0px 20px',
              textAlign: 'left'
            }}>
              <h1 
                id="page-title"
                style={{ 
                  fontSize: isMobile ? '18px' : '30px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 12px 0',
                  lineHeight: '1.2',
                  fontFamily: 'Arial, sans-serif',
                  display: 'inline-block'
                }}
              >
                {edition?.title || ''} - {edition?.date ? new Date(edition.date).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                }) : ''} - Page {currentPage}
              </h1>
              
              {/* Combined Line */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '0 0 8px 0',
                width: '100%'
              }}>
                <div style={{
                  width: `${titleWidth}px`,
                  minWidth: '100px',
                  height: '6px',
                  backgroundColor: '#fd7e14',
                  flexShrink: 0,
                  transition: 'width 0.3s ease'
                }}></div>
                
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: '#d1d5db'
                }}></div>
              </div>
            </div>
            
            {/* Page Display Area */}
            <div style={{ 
              flex: 1, 
              backgroundColor: '#f9fafb',
              position: 'relative',
              overflow: 'visible',
              minHeight: isMobile ? 'fit-content' : '75vh'
            }}>
              {currentPageData ? (
                <div style={{ 
                  minHeight: isMobile ? 'fit-content' : '75vh',
                  overflow: 'visible',
                  padding: isMobile ? '0px' : '12px 24px',
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {/* Navigation Buttons - Now visible on BOTH desktop and mobile */}
                  {currentPage > 1 && (
                    <button
                      onClick={goToPrevious}
                      style={{
                        position: 'absolute',
                        left: isMobile ? '2px' : '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: isMobile ? '40px' : '45px',
                        height: isMobile ? '120px' : '157px',
                        backgroundColor: 'rgba(120, 120, 120, 0.63)',
                        border: 'none',
                        borderRadius: '0px',
                        cursor: 'pointer',
                        zIndex: 10001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                        color: '#ffffff',
                        touchAction: 'manipulation'
                      }}
                      title={`Previous Page (${currentPage - 1})`}
                    >
                      {/* Double Left Triangle << */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                        <div style={{
                          width: 0,
                          height: 0,
                          borderTop: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderBottom: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderRight: isMobile ? '9px solid #ffffff' : '10px solid #ffffff'
                        }}></div>
                        <div style={{
                          width: 0,
                          height: 0,
                          borderTop: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderBottom: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderRight: isMobile ? '9px solid #ffffff' : '10px solid #ffffff'
                        }}></div>
                      </div>
                    </button>
                  )}

                  {currentPage < pages.length && (
                    <button
                      onClick={goToNext}
                      style={{
                        position: 'absolute',
                        right: isMobile ? '2px' : '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: isMobile ? '40px' : '45px',
                        height: isMobile ? '120px' : '157px',
                        backgroundColor: 'rgba(120, 120, 120, 0.63)',
                        border: 'none',
                        borderRadius: '0px',
                        cursor: 'pointer',
                        zIndex: 10001,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                        color: '#ffffff',
                        touchAction: 'manipulation'
                      }}
                      title={`Next Page (${currentPage + 1})`}
                    >
                      {/* Double Right Triangle >> */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                        <div style={{
                          width: 0,
                          height: 0,
                          borderTop: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderBottom: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderLeft: isMobile ? '9px solid #ffffff' : '10px solid #ffffff'
                        }}></div>
                        <div style={{
                          width: 0,
                          height: 0,
                          borderTop: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderBottom: isMobile ? '7px solid transparent' : '8px solid transparent',
                          borderLeft: isMobile ? '9px solid #ffffff' : '10px solid #ffffff'
                        }}></div>
                      </div>
                    </button>
                  )}

                  {/* LazyPageViewer - REWRITTEN WITH WORKING STRUCTURE */}
                  <div style={{
                    maxWidth: '100%',
                    height: 'auto',
                    boxShadow: isMobile ? 'none' : '0 8px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    borderRadius: isMobile ? '0px' : '8px',
                    position: 'relative',
                    overflow: 'visible'
                  }}>
                    {/* EXACT STRUCTURE FROM WORKING EpaperPageDisplayWidget */}
                    <div 
                      key={`${editionId}-${currentPage}-${currentPageData?.id || 'no-page'}`}
                      className="epaper-container"
                      style={{
                        width: '100%',
                        minHeight: '600px',
                        boxSizing: 'border-box',
                        overflow: 'visible'
                      }}
                    >
                      <LazyPageViewer
                        key={`${editionId}-${currentPage}-${currentPageData?.id || 'no-page'}`}
                        page={{
                          number: currentPageData.page_number,
                          imageUrl: currentPageData.image_url,
                          id: currentPageData.id
                        }}
                        zoom={1}
                        isClipping={isClipping}
                        onClipComplete={handleClipComplete}
                        onClipCancel={handleClipCancel}
                        onPrevPage={goToPrevious}
                        onNextPage={goToNext}
                        loading={loading}
                        editionId={editionId || ''}
                        totalPages={pages.length}
                        areaMaps={areaMaps.filter(area => area.page_number === currentPage)}
                        onAreaClick={handleAreaClick}
                        onFullPageClick={handleFullPageClick}
                        watermarkSettings={watermarkSettings}
                        edition={edition}
                        currentPageData={currentPageData}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Blank screen while loading - no message
                <div style={{ 
                  height: '100%', 
                  backgroundColor: '#ffffff'
                }}></div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Thumbnail Strip */}
        {isMobile && (
          <div style={{ 
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            backgroundColor: '#ffffff',
            borderTop: '2px solid #e5e7eb',
            padding: '6px 8px',
            zIndex: 99999,
            height: '56px',
            boxSizing: 'border-box',
            pointerEvents: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px',
              width: '100%',
              height: '100%',
            }}>
              {/* Page Select */}
              <select
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                style={{
                  height: '36px',
                  padding: '0 4px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '600',
                  flex: '1 1 0',
                  minWidth: '0',
                  maxWidth: '100px',
                  outline: 'none',
                  borderRadius: '0px',
                }}
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.page_number}>
                    Page {page.page_number}
                  </option>
                ))}
              </select>

              {/* Prev button */}
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                style={{
                  height: '36px',
                  flex: '0 0 36px',
                  padding: '0',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                  border: '2px solid #e5e7eb',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? '#9ca3af' : '#dc2626',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `8px solid ${currentPage === 1 ? '#9ca3af' : '#dc2626'}` }}></div>
              </button>

              {/* Page counter */}
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                {currentPage}/{pages.length}
              </span>

              {/* Next button */}
              <button
                onClick={goToNext}
                disabled={currentPage === pages.length}
                style={{
                  height: '36px',
                  flex: '0 0 36px',
                  padding: '0',
                  backgroundColor: currentPage === pages.length ? '#f3f4f6' : '#ffffff',
                  border: '2px solid #e5e7eb',
                  cursor: currentPage === pages.length ? 'not-allowed' : 'pointer',
                  color: currentPage === pages.length ? '#9ca3af' : '#dc2626',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: `8px solid ${currentPage === pages.length ? '#9ca3af' : '#dc2626'}` }}></div>
              </button>

              {/* Download PDF */}
              <button
                onClick={handleDownloadPDF}
                disabled={!edition?.pdf_url}
                style={{
                  height: '36px',
                  flex: '0 0 36px',
                  backgroundColor: edition?.pdf_url ? '#f97316' : '#9ca3af',
                  color: '#ffffff',
                  border: 'none',
                  cursor: edition?.pdf_url ? 'pointer' : 'not-allowed',
                  opacity: edition?.pdf_url ? 1 : 0.6,
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={edition?.pdf_url ? 'Download PDF' : 'PDF not available'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </button>

              {/* Clip */}
              <button
                onClick={handleClip}
                style={{
                  height: '36px',
                  flex: '0 0 36px',
                  backgroundColor: isClipping ? '#16a34a' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                title={isClipping ? 'Stop Clipping' : 'Start Clipping'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3L13,9L15,11L22,4V3M12,12.5A0.5,0.5 0 0,1 11.5,12A0.5,0.5 0 0,1 12,11.5A0.5,0.5 0 0,1 12.5,12A0.5,0.5 0 0,1 12,12.5M6,20A2,2 0 0,1 4,18C4,16.89 4.9,16 6,16A2,2 0 0,1 8,18C8,19.11 7.1,20 6,20M6,8A2,2 0 0,1 4,6C4,4.89 4.9,4 6,4A2,2 0 0,1 8,6C8,7.11 7.1,8 6,8M9.64,7.64C9.87,7.14 10,6.59 10,6A4,4 0 0,0 6,2A4,4 0 0,0 2,6A4,4 0 0,0 6,10C6.59,10 7.14,9.87 7.64,9.64L10,12L7.64,14.36C7.14,14.13 6.59,14 6,14A4,4 0 0,0 2,18A4,4 0 0,0 6,22A4,4 0 0,0 10,18C10,17.41 9.87,16.86 9.64,16.36L12,14L19,21H22V20L9.64,7.64Z"/>
                </svg>
              </button>

              {/* Archive */}
              <button
                onClick={handleArchiveClick}
                style={{
                  height: '36px',
                  flex: '0 0 36px',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Archive"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V7H5V5H19M19,9V19H5V9H19M7,11V13H9V11H7M11,11V13H13V11H11M15,11V13H17V11H15M7,15V17H9V15H7M11,15V17H13V15H11M15,15V17H17V15H15Z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clip Preparation Loading Spinner - Shows BEFORE modal opens */}
      {isPreparingClip && (
        <div 
          className="clip-loading-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10003,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <DottedCircleLoader />
        </div>
      )}

      {/* Share Modal - Opens ONLY when everything is ready */}
      {showShareModal && clippedImage && (
        <ShareModal
          clippedImage={clippedImage}
          editionId={editionId || ''}
          pageNumber={currentPage}
          onClose={handleCloseShareModal}
          savedClip={savedClipData}
        />
      )}

      {/* Area Modal - Exact Design as Screenshots */}
      {showAreaModal && selectedArea && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(229, 231, 235, 0.6)', // More translucent light grey background outside
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '20px 10px' : '40px 20px'
          }}
          className="area-modal-container"
          onClick={handleCloseAreaModal}
        >
          <div 
            className="area-modal-content"
            style={{
              backgroundColor: '#ffffff',
              border: '4px solid #b91c1c', // Dark red border
              borderRadius: '0px', // Sharp corners
              width: isMobile ? '85vw' : '90vw', // Smaller width for mobile to accommodate cancel button
              maxWidth: isMobile ? 'none' : '900px',
              height: isMobile ? '70vh' : 'auto', // Reduced height for mobile - fits image + share icons
              maxHeight: isMobile ? '70vh' : '85vh', // Smaller height for mobile
              overflow: 'visible', // Allow cancel button to show outside
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', // Simple shadow (no glow)
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cancel Button - ON Modal Border (exactly like PC view for both mobile and desktop) */}
            <button
              onClick={handleCloseAreaModal}
              className="area-modal-cancel"
              style={{
                position: 'absolute',
                top: '-25px', // Half button height outside modal
                right: '-25px', // Half button width outside modal
                width: '50px', // Same size for both mobile and desktop
                height: '50px', // Same size for both mobile and desktop
                minWidth: '50px', // Ensure minimum width
                minHeight: '50px', // Ensure minimum height
                backgroundColor: '#dc2626',
                color: 'white',
                border: '3px solid white',
                borderRadius: '50%',
                fontSize: '30px', // Larger font for better centering
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 10005,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1', // Better vertical centering
                textAlign: 'center', // Better horizontal centering
                boxShadow: '0 0 20px rgba(220, 38, 38, 0.6), 0 4px 12px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease',
                flexShrink: 0 // Prevent shrinking
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
            {/* Modal Content - Scrollable - BOTH VERTICAL AND HORIZONTAL SCROLL */}
            <div 
              className="thumbnail-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'auto', // Enable horizontal scroll
                backgroundColor: '#ffffff',
              }}>
              {/* Share Icons REMOVED FROM TOP - Now at bottom */}
              {/* Navigation Buttons - Overlay on Image Center */}
              {/* Navigation Buttons - Hide when zoomed */}
              {!isZoomed && selectedArea && selectedArea.id !== 0 && (() => {
                const currentPageAreas = areaMaps.filter(a => a.page_number === currentPage);
                if (currentPageAreas.length <= 1) return null;
                
                return (
                  <>
                    {/* Previous Button - Left Side - Positioned on Image Center */}
                    <button
                      onClick={(e) => handlePreviousArea(e)}
                      disabled={currentAreaIndex === 0}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px 10px',
                        backgroundColor: currentAreaIndex === 0 ? '#d1d5db' : '#9ca3af',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: currentAreaIndex === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: currentAreaIndex === 0 ? 0.5 : 0.8,
                        zIndex: 10003,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                        display: isZoomed ? 'none' : 'block'
                      }}
                      onMouseEnter={(e) => {
                        if (currentAreaIndex > 0) {
                          e.currentTarget.style.backgroundColor = '#6b7280';
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentAreaIndex > 0) {
                          e.currentTarget.style.backgroundColor = '#9ca3af';
                          e.currentTarget.style.opacity = '0.8';
                        }
                      }}
                      title="Previous Area"
                    >
                      Prev
                    </button>

                    {/* Next Button - Right Side - Positioned on Image Center */}
                    <button
                      onClick={(e) => handleNextArea(e)}
                      disabled={currentAreaIndex >= currentPageAreas.length - 1}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '6px 10px',
                        backgroundColor: currentAreaIndex >= currentPageAreas.length - 1 ? '#d1d5db' : '#9ca3af',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: currentAreaIndex >= currentPageAreas.length - 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: currentAreaIndex >= currentPageAreas.length - 1 ? 0.5 : 0.8,
                        zIndex: 10003,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                        display: isZoomed ? 'none' : 'block'
                      }}
                      onMouseEnter={(e) => {
                        const currentPageAreas = areaMaps.filter(a => a.page_number === currentPage);
                        if (currentAreaIndex < currentPageAreas.length - 1) {
                          e.currentTarget.style.backgroundColor = '#6b7280';
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const currentPageAreas = areaMaps.filter(a => a.page_number === currentPage);
                        if (currentAreaIndex < currentPageAreas.length - 1) {
                          e.currentTarget.style.backgroundColor = '#9ca3af';
                          e.currentTarget.style.opacity = '0.8';
                        }
                      }}
                      title="Next Area"
                    >
                      Next
                    </button>
                  </>
                );
              })()}

              {/* Area Image - Centered inside box (like ShareModal) */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '8px',
                position: 'relative',
                minHeight: modalImageLoading && !modalImageLoaded ? '200px' : 'auto'
              }}>
                {/* Loading Overlay */}
                {modalImageLoading && !modalImageLoaded && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(249, 250, 251, 0.9)',
                    borderRadius: '8px',
                    zIndex: 10004
                  }}>
                    <DottedCircleLoader dark />
                  </div>
                )}

                {modalWatermarkedImage && (
                  <img
                    src={modalWatermarkedImage}
                    alt={selectedArea.title || `Area ${selectedArea.id}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '60vh',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                      borderRadius: '4px',
                      transition: 'filter 0.4s ease, opacity 0.4s ease',
                      filter: modalImageLoaded ? 'none' : 'blur(10px)',
                      opacity: modalImageLoaded ? 1 : 0.3
                    }}
                    draggable={false}
                    onLoad={() => {
                      setModalImageLoaded(true);
                      setModalImageLoading(false);
                    }}
                    onError={() => {
                      setModalImageLoading(false);
                      setModalImageLoaded(false);
                    }}
                  />
                )}
              </div>

              {/* Share Icons - Always Below Image */}
              <div style={{
                marginTop: '20px',
                paddingTop: '15px',
                borderTop: '2px solid #e9ecef',
                backgroundColor: '#ffffff',
                clear: 'both'
              }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'center',
                    paddingBottom: '5px',
                    flexWrap: 'wrap',
                    maxWidth: isMobile ? '320px' : 'none',
                    margin: '0 auto'
                  }}
                >
                {/* Copy Link - FIRST */}
                <button
                  onClick={() => {
                    // Use area map dedicated URL instead of current page URL
                    const areaMapUrl = selectedArea?.id === 0
                      ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                      : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                    
                    const doCopy = () => {
                      // fallback for when clipboard API fails (document not focused)
                      const ta = document.createElement('textarea');
                      ta.value = areaMapUrl;
                      ta.style.position = 'fixed';
                      ta.style.opacity = '0';
                      document.body.appendChild(ta);
                      ta.focus();
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                    };
                    try {
                      if (navigator.clipboard && document.hasFocus()) {
                        navigator.clipboard.writeText(areaMapUrl).catch(() => doCopy());
                      } else {
                        doCopy();
                      }
                      // Show success feedback
                      const btn = document.activeElement as HTMLButtonElement;
                      const originalBg = btn?.style?.backgroundColor || '#ff6b35';
                      if (btn) {
                        btn.style.backgroundColor = '#10b981';
                        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
                        setTimeout(() => {
                          btn.style.backgroundColor = originalBg;
                          btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
                        }, 1500);
                      }
                    } catch {
                      doCopy();
                    }
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Copy Area Map Link"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => {
                    const areaMapUrl = selectedArea?.id === 0
                      ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                      : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                    const url = encodeURIComponent(areaMapUrl);
                    const text = encodeURIComponent(`Check out this ${selectedArea?.id === 0 ? 'page' : 'area'} from ${edition?.title || 'Epaper'}`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#3b5998',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Share on Facebook"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>

                {/* X (Twitter) */}
                <button
                  onClick={() => {
                    const areaMapUrl = selectedArea?.id === 0
                      ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                      : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                    const url = encodeURIComponent(areaMapUrl);
                    const text = encodeURIComponent(`Check out this ${selectedArea?.id === 0 ? 'page' : 'area'} from ${edition?.title || 'Epaper'}`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#000000',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Share on X (Twitter)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>

                {/* WhatsApp - Shares Image + Area Map Link */}
                <button
                  onClick={() => {
                    const areaMapUrl = selectedArea?.id === 0
                      ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                      : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                    const text = `Check out this ${selectedArea?.id === 0 ? 'page' : 'area'} from ${edition?.title || 'Epaper'}: ${areaMapUrl}`;
                    shareOnWhatsApp(text);
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#25d366',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Share on WhatsApp (Image + Link)"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488"/>
                  </svg>
                </button>

                {/* Telegram - Shares Image + Area Map Link */}
                <button
                  onClick={() => {
                    const areaMapUrl = selectedArea?.id === 0
                      ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                      : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                    const text = `Check out this ${selectedArea?.id === 0 ? 'page' : 'area'} from ${edition?.title || 'Epaper'}`;
                    const encodedUrl = encodeURIComponent(areaMapUrl);
                    const encodedText = encodeURIComponent(text);
                    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#0088cc',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Share on Telegram (Image + Link)"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </button>

                {/* Instagram */}
                <button
                  onClick={() => {
                    alert('Instagram sharing requires the Instagram app. Please use the mobile app to share.');
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Share on Instagram"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => {
                    const areaMapUrl = selectedArea?.id === 0
                      ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                      : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                    const url = encodeURIComponent(areaMapUrl);
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#0077b5',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Share on LinkedIn"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>

                {/* Print */}
                <button
                  onClick={() => {
                    if (modalWatermarkedImage) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Print ${selectedArea?.id === 0 ? 'Page' : 'Area'} - ${edition?.title || 'Epaper'}</title>
                              <style>
                                body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }
                                img { max-width: 100%; height: auto; }
                                .print-info { margin-top: 20px; font-size: 12px; color: #666; }
                              </style>
                            </head>
                            <body>
                              <h2>${edition?.title || 'Epaper'} - Page ${currentPage}</h2>
                              <img src="${modalWatermarkedImage}" alt="${selectedArea?.id === 0 ? 'Page' : 'Area'} Image" />
                              <div class="print-info">
                                <p>Printed from: ${window.location.href}</p>
                                <p>Date: ${new Date().toLocaleDateString()}</p>
                              </div>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Print"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                  </svg>
                </button>

                {/* Generic Share - LAST - Shares Image + Area Map Link */}
                <button
                  onClick={async () => {
                    const areaMapUrl = selectedArea?.id === 0
                      ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                      : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                    
                    if (modalWatermarkedImage && navigator.share) {
                      try {
                        // Convert base64 to blob
                        const response = await fetch(modalWatermarkedImage);
                        const blob = await response.blob();
                        const file = new File([blob], `${selectedArea?.title || 'area'}-${selectedArea?.id}.png`, { type: 'image/png' });
                        
                        await navigator.share({
                          title: `${selectedArea?.id === 0 ? 'Page' : 'Area'} from ${edition?.title || 'Epaper'}`,
                          text: `Check out this ${selectedArea?.id === 0 ? 'page' : 'area'} from ${edition?.title || 'Epaper'}`,
                          url: areaMapUrl,
                          files: [file]
                        });
                      } catch (error: any) {
                        // User cancelled share or pressed back - don't show error
                        if (error.name === 'AbortError') {
                          return;
                        }
                        console.error('Error sharing:', error);
                        // Fallback to URL only
                        try {
                          await navigator.share({
                            title: `${selectedArea?.id === 0 ? 'Page' : 'Area'} from ${edition?.title || 'Epaper'}`,
                            url: areaMapUrl
                          });
                        } catch (err: any) {
                          // Only show error if not user cancellation
                          if (err.name !== 'AbortError') {
                            alert('Share feature not supported on this browser');
                          }
                        }
                      }
                    } else {
                      alert('Share feature not supported on this browser');
                    }
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    backgroundColor: '#1e90ff',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Share Image & Link"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                  </svg>
                </button>
              </div>
            </div>
            </div>

            {/* Open + Download Buttons */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '15px',
              borderTop: '2px solid #e9ecef',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <button
                onClick={() => {
                  const areaMapUrl = selectedArea?.id === 0
                    ? `${window.location.origin}/epaper/full-page/${editionId}/${currentPage}`
                    : `${window.location.origin}/epaper/area-map/${selectedArea?.id}`;
                  window.open(areaMapUrl, '_blank');
                }}
                style={{
                  padding: isMobile ? '10px 0' : '12px 0',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  border: '2px solid #374151',
                  fontSize: isMobile ? '13px' : '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '6px' : '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
                Open
              </button>
              <button
                onClick={() => {
                  if (modalWatermarkedImage) {
                    const link = document.createElement('a');
                    link.href = modalWatermarkedImage;
                    link.download = `${selectedArea.title || 'area'}-${selectedArea.id}.png`;
                    link.click();
                  }
                }}
                disabled={!modalWatermarkedImage}
                style={{
                  padding: isMobile ? '10px 0' : '12px 0',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: '2px solid #b91c1c',
                  fontSize: isMobile ? '13px' : '15px',
                  fontWeight: '700',
                  cursor: modalWatermarkedImage ? 'pointer' : 'not-allowed',
                  opacity: modalWatermarkedImage ? 1 : 0.6,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '6px' : '6px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (modalWatermarkedImage) {
                    e.currentTarget.style.backgroundColor = '#b91c1c';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .clip-loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes glow {
          0% { box-shadow: 0 0 40px rgba(185, 28, 28, 0.4), 0 10px 30px rgba(0, 0, 0, 0.5); }
          50% { box-shadow: 0 0 60px rgba(185, 28, 28, 0.6), 0 15px 40px rgba(0, 0, 0, 0.6); }
          100% { box-shadow: 0 0 40px rgba(185, 28, 28, 0.4), 0 10px 30px rgba(0, 0, 0, 0.5); }
        }
        
        .area-modal-content {
          animation: glow 2s ease-in-out infinite;
        }
        
        /* Thumbnail Sidebar Scrollbar - Enhanced with Triangles */
        .desktop-sidebar::-webkit-scrollbar {
          width: 10px !important; /* 20% reduced from 12px */
        }
        
        .desktop-sidebar::-webkit-scrollbar-track {
          background: #f3f4f6 !important; /* Light grey */
          border-radius: 8px !important;
        }
        
        .desktop-sidebar::-webkit-scrollbar-thumb {
          background: #d1d5db !important; /* Light grey */
          border-radius: 8px !important;
          border: 1px solid #f3f4f6 !important;
          transition: background-color 0.2s ease !important;
        }
        
        .desktop-sidebar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af !important; /* Grey on hover */
        }
        
        /* Force scrollbar buttons to show */
        .desktop-sidebar::-webkit-scrollbar-button {
          display: block !important;
          height: 16px !important;
          width: 10px !important;
          background-color: #f3f4f6 !important;
          border: 1px solid #e5e7eb !important;
        }
        
        /* Top button with up triangle */
        .desktop-sidebar::-webkit-scrollbar-button:vertical:start:decrement {
          background: #f3f4f6 !important;
          border-radius: 8px 8px 0 0 !important;
          background-image: linear-gradient(45deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%), 
                           linear-gradient(-45deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%) !important;
          background-size: 8px 8px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }
        
        .desktop-sidebar::-webkit-scrollbar-button:vertical:start:decrement:hover {
          background-color: #e5e7eb !important;
          background-image: linear-gradient(45deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%), 
                           linear-gradient(-45deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%) !important;
        }
        
        /* Bottom button with down triangle */
        .desktop-sidebar::-webkit-scrollbar-button:vertical:end:increment {
          background: #f3f4f6 !important;
          border-radius: 0 0 8px 8px !important;
          background-image: linear-gradient(135deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%), 
                           linear-gradient(-135deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%) !important;
          background-size: 8px 8px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }
        
        .desktop-sidebar::-webkit-scrollbar-button:vertical:end:increment:hover {
          background-color: #e5e7eb !important;
          background-image: linear-gradient(135deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%), 
                           linear-gradient(-135deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%) !important;
        }
        
        /* Inner thumbnail container scrollbar */
        .desktop-sidebar > div::-webkit-scrollbar {
          width: 10px !important;
        }
        
        .desktop-sidebar > div::-webkit-scrollbar-track {
          background: #f3f4f6 !important;
          border-radius: 8px !important;
        }
        
        .desktop-sidebar > div::-webkit-scrollbar-thumb {
          background: #d1d5db !important;
          border-radius: 8px !important;
          border: 1px solid #f3f4f6 !important;
          transition: background-color 0.2s ease !important;
        }
        
        .desktop-sidebar > div::-webkit-scrollbar-thumb:hover {
          background: #9ca3af !important;
        }
        
        /* Force inner scrollbar buttons to show */
        .desktop-sidebar > div::-webkit-scrollbar-button {
          display: block !important;
          height: 16px !important;
          width: 10px !important;
          background-color: #f3f4f6 !important;
          border: 1px solid #e5e7eb !important;
        }
        
        /* Inner top button with up triangle */
        .desktop-sidebar > div::-webkit-scrollbar-button:vertical:start:decrement {
          background: #f3f4f6 !important;
          border-radius: 8px 8px 0 0 !important;
          background-image: linear-gradient(45deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%), 
                           linear-gradient(-45deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%) !important;
          background-size: 8px 8px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }
        
        .desktop-sidebar > div::-webkit-scrollbar-button:vertical:start:decrement:hover {
          background-color: #e5e7eb !important;
          background-image: linear-gradient(45deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%), 
                           linear-gradient(-45deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%) !important;
        }
        
        /* Inner bottom button with down triangle */
        .desktop-sidebar > div::-webkit-scrollbar-button:vertical:end:increment {
          background: #f3f4f6 !important;
          border-radius: 0 0 8px 8px !important;
          background-image: linear-gradient(135deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%), 
                           linear-gradient(-135deg, transparent 40%, #d1d5db 40%, #d1d5db 60%, transparent 60%) !important;
          background-size: 8px 8px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }
        
        .desktop-sidebar > div::-webkit-scrollbar-button:vertical:end:increment:hover {
          background-color: #e5e7eb !important;
          background-image: linear-gradient(135deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%), 
                           linear-gradient(-135deg, transparent 40%, #9ca3af 40%, #9ca3af 60%, transparent 60%) !important;
        }
        
        @media (max-width: 768px) {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Mobile modal adjustments */
          .area-modal-container {
            padding: 20px 10px !important;
          }
          
          .area-modal-content {
            width: 85vw !important; /* Smaller to accommodate cancel button */
            max-width: none !important;
            max-height: 80vh !important; /* Smaller height */
          }
          
          .area-modal-social {
            padding: 10px 15px !important;
            gap: 8px !important;
          }
          
          .area-modal-social button {
            width: 35px !important;
            height: 35px !important;
            font-size: 16px !important;
          }
          
          .area-modal-cancel {
            top: -25px !important;
            right: -25px !important;
            left: auto !important;
            width: 50px !important;
            height: 50px !important;
            font-size: 28px !important;
          }
        }
      `}</style>

      {/* Mobile Calendar Modal */}
      {showCalendarModal && isMobile && (
        <CalendarModal
          onClose={handleCloseCalendarModal}
          categoryId={edition?.category_id}
        />
      )}
      </div>
    </>
  );
}

export default StaticEpaperLayout;