'use client';

import { useState, useRef, useEffect } from 'react';
import { useEpaperSafe } from '@/contexts/EpaperContext';
import { Download } from 'lucide-react';

// Global cache outside component to persist across unmounts
const globalLogoCache: {[key: string]: string} = {};
const globalSettingsCache: {[key: string]: any} = {};

interface EpaperAreaMapDisplayWidgetProps {
  config: {
    title?: string;
    cssClasses?: string;
    style?: string;
    editionId?: string;
  };
  areaMapId?: string;
  editionId?: string;
  pageNumber?: string;
}

export function EpaperAreaMapDisplayWidget({ config, areaMapId, editionId: propEditionId, pageNumber: propPageNumber }: EpaperAreaMapDisplayWidgetProps) {
  console.log('🎯 EpaperAreaMapDisplayWidget rendered with props:', {
    areaMapId,
    propEditionId,
    propPageNumber,
    config,
    timestamp: new Date().toISOString()
  });
  
  // Try to get context, but don't fail if not available
  const epaperContext = useEpaperSafe();
  const contextEditionId = epaperContext?.editionId;
  
  const editionId = propEditionId || contextEditionId;
  
  console.log('🔧 Final props for widget:', {
    areaMapId,
    editionId,
    pageNumber: propPageNumber,
    hasConfig: !!config
  });
  
  const [areaMapData, setAreaMapData] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [combinedImage, setCombinedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryLogoUrl, setCategoryLogoUrl] = useState<string | null>(null);
  const [watermarkSettings, setWatermarkSettings] = useState<any>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 }); // Percentage
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Add state for edition data
  const [editionData, setEditionData] = useState<any>(null);

  // Create combined image with logo, info text, and area map
  const createCombinedAreaImage = async () => {
    if (!croppedImage || !canvasRef.current) return;

    try {
      console.log('🎨 Creating combined area map image...');
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load cropped image
      const areaImg = new Image();
      areaImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        areaImg.onload = () => resolve();
        areaImg.onerror = reject;
        areaImg.src = croppedImage;
      });

      // Calculate dimensions
      const areaWidth = areaImg.width;
      const areaHeight = areaImg.height;
      const headerHeight = Math.max(120, areaHeight * 0.25); // 25% of area height, minimum 120px
      
      // Set canvas size
      canvas.width = areaWidth;
      canvas.height = areaHeight + headerHeight;

      // Draw header background
      ctx.fillStyle = watermarkSettings?.background_color || '#f9fafb';
      ctx.fillRect(0, 0, areaWidth, headerHeight);

      // Draw border if enabled
      if (watermarkSettings?.enable_border) {
        ctx.strokeStyle = watermarkSettings?.border_color || '#e5e7eb';
        ctx.lineWidth = watermarkSettings?.border_width || 2;
        ctx.strokeRect(0, 0, areaWidth, areaHeight + headerHeight);
      }

      // Draw border at bottom of header
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(areaWidth, headerHeight);
      ctx.stroke();

      // Draw logo
      if (categoryLogoUrl) {
        try {
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 3000);
            
            logo.onload = () => {
              clearTimeout(timeout);
              
              // Logo size - 60% of header height
              const logoHeight = headerHeight * 0.6;
              const logoWidth = (logo.width / logo.height) * logoHeight;
              const logoX = (areaWidth - logoWidth) / 2;
              const logoY = 15;
              
              ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
              console.log('✅ Logo drawn in combined area map');
              resolve();
            };
            
            logo.onerror = () => {
              clearTimeout(timeout);
              console.error('❌ Logo failed to load in combined area map');
              resolve();
            };
            
            logo.src = categoryLogoUrl;
          });
        } catch (error) {
          console.error('❌ Error loading logo for combined area map:', error);
        }
      }

      // Draw info text
      if (watermarkSettings?.info_text) {
        const processedText = watermarkSettings.info_text
          .replace(/\{newline\}/g, '\n')
          .replace(/\{edition_title\}/g, editionData?.title || '')
          .replace(/\{date\}/g, editionData?.date ? new Date(editionData.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short', 
            year: 'numeric'
          }) : '')
          .replace(/\{url\}/g, `${window.location.origin}/epaper/view/${editionId}`);

        if (processedText.trim()) {
          ctx.fillStyle = watermarkSettings.foreground_color || '#1f2937';
          ctx.textAlign = 'center';
          ctx.font = '16px Arial';
          
          const lines = processedText.split('\n');
          const lineHeight = 20;
          const logoHeight = headerHeight * 0.6;
          const textStartY = 15 + logoHeight + 25; // Below logo
          
          lines.forEach((line: string, index: number) => {
            if (line.trim()) {
              ctx.fillText(line.trim(), areaWidth / 2, textStartY + (index * lineHeight));
            }
          });
          
          console.log('✅ Info text drawn in combined area map');
        }
      }

      // Draw area map image
      ctx.drawImage(areaImg, 0, headerHeight, areaWidth, areaHeight);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setCombinedImage(dataUrl);
      
      console.log('✅ Combined area map image created successfully');
    } catch (error) {
      console.error('❌ Error creating combined area map image:', error);
    }
  };

  // Create combined image when cropped image and settings are ready
  useEffect(() => {
    if (croppedImage && (categoryLogoUrl || watermarkSettings)) {
      createCombinedAreaImage();
    }
  }, [croppedImage, categoryLogoUrl, watermarkSettings, editionData]);

  // Fetch area map data and create cropped image
  useEffect(() => {
    if (!areaMapId) {
      console.warn('EpaperAreaMapDisplayWidget: No areaMapId provided');
      setLoading(false);
      return;
    }
    
    if (!editionId) {
      console.warn('EpaperAreaMapDisplayWidget: No editionId provided');
      setLoading(false);
      return;
    }
    
    const fetchAndCropImage = async () => {
      try {
        setLoading(true);
        
        // Fetch area map data with watermark processing
        const areaResponse = await fetch(`/api/area-maps/${areaMapId}?watermark=true`);
        const areaResult = await areaResponse.json();
        
        if (!areaResult.success) {
          console.error('Failed to fetch area map:', areaResult.error);
          setLoading(false);
          return;
        }
        
        const areaData = areaResult.data;
        setAreaMapData(areaData);
        
        // Fetch page data
        const pageResponse = await fetch(`/api/editions/${editionId}/pages/${areaData.page_id}`);
        const pageResult = await pageResponse.json();
        
        if (!pageResult.success) {
          console.error('Failed to fetch page:', pageResult.error);
          setLoading(false);
          return;
        }
        
        const page = pageResult.data;
        setPageData(page);
        
        // Fetch edition to get category_id and date
        const editionResponse = await fetch(`/api/editions/${editionId}`);
        const editionResult = await editionResponse.json();
        
        if (editionResult.success && editionResult.data) {
          const edition = editionResult.data;
          setEditionData(edition); // Store edition data for date
          
          if (edition.category_id) {
            const categoryId = edition.category_id;
            const cacheKey = `category_${categoryId}`;
            
            // PERMANENT SOLUTION: Fetch watermark settings with multiple fallbacks
            console.log('🌐 Fetching watermark settings for category:', categoryId);
            console.log('🔗 API URL will be:', `/api/settings/category-watermark?category_id=${categoryId}`);
            
            try {
              // Try category-specific settings first
              const categoryResponse = await fetch(`/api/settings/category-watermark?category_id=${categoryId}`);
              const categoryResult = await categoryResponse.json();
              
              console.log('🔍 Category API Response Status:', categoryResponse.status);
              console.log('🔍 Category API Response:', categoryResult);
              
              let finalSettings = null;
              let logoUrl = null;
              
              // Check if category has custom settings with logo
              if (categoryResult.success && categoryResult.data) {
                const data = categoryResult.data;
                console.log('🔍 Category data received:', data);
                console.log('🔍 Enable watermarking:', data.enable_watermarking);
                console.log('🔍 Logo URL:', data.logo_url);
                console.log('🔍 Info text:', data.info_text);
                
                // Use category settings if watermarking is enabled and logo exists
                if (data.enable_watermarking && (data.logo_url || data.center_watermark_url)) {
                  finalSettings = data;
                  logoUrl = data.logo_url || data.center_watermark_url;
                  console.log('✅ Using category-specific watermark settings');
                } else {
                  console.log('⚠️ Category settings exist but no logo or watermarking disabled');
                  console.log('⚠️ Enable watermarking:', data.enable_watermarking);
                  console.log('⚠️ Logo URL:', data.logo_url);
                }
              } else {
                console.log('⚠️ Category API failed or returned no data');
              }
              
              // Fallback to global area map watermark settings
              if (!finalSettings || !logoUrl) {
                console.log('🔄 Falling back to global area map watermark settings');
                const globalResponse = await fetch('/api/settings/area-map-watermark');
                const globalResult = await globalResponse.json();
                
                console.log('🔍 Global API Response:', globalResult);
                
                if (globalResult.success && globalResult.data) {
                  const globalData = globalResult.data;
                  
                  if (globalData.enable_watermarking && (globalData.logo_url || globalData.center_watermark_url)) {
                    finalSettings = globalData;
                    logoUrl = globalData.logo_url || globalData.center_watermark_url;
                    console.log('✅ Using global watermark settings');
                  }
                }
              }
              
              // ULTIMATE FALLBACK: Use test logo if nothing else works
              if (!finalSettings || !logoUrl) {
                console.log('🔄 Using ultimate fallback - test logo and settings');
                finalSettings = {
                  enable_watermarking: true,
                  logo_url: '/sample-watermark.svg', // Use sample logo from public folder
                  opacity: 100,
                  background_color: '#ffffff',
                  foreground_color: '#000000',
                  enable_border: true,
                  border_width: 2,
                  border_color: '#e5e7eb',
                  info_text: 'Test Newspaper{newline}{date}{newline}{edition_title}',
                  info_text_font: 'English'
                };
                logoUrl = '/sample-watermark.svg';
                console.log('✅ Using fallback test settings');
              }
              
              // Set final settings and logo
              if (finalSettings && logoUrl) {
                console.log('✅ Final watermark settings:', finalSettings);
                console.log('✅ Final logo URL:', logoUrl);
                
                setWatermarkSettings(finalSettings);
                setCategoryLogoUrl(logoUrl);
              } else {
                console.error('❌ All fallbacks failed - no watermark settings available');
                setWatermarkSettings(null);
                setCategoryLogoUrl(null);
              }
              
            } catch (error) {
              console.error('❌ Error fetching watermark settings:', error);
              
              // NO FALLBACK - If settings can't be loaded, don't show any watermark
              console.log('⚠️ No watermark settings available - no watermark will be shown');
              setWatermarkSettings(null);
              setCategoryLogoUrl(null);
            }
          }
        }
        
        // Create cropped image
        await createCroppedImage(areaData, page);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching area map:', error);
        setLoading(false);
      }
    };
    
    fetchAndCropImage();
  }, [areaMapId, editionId]); // Only depend on areaMapId and editionId
  
  const createCroppedImage = async (area: any, page: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Check if area has linked areas
    const hasLinkedAreas = area.linked_area_ids && area.linked_area_ids.length > 0;
    
    if (hasLinkedAreas) {
      // Create combined image with linked areas - pass logo URL
      await createCombinedImage(area, categoryLogoUrl, watermarkSettings);
    } else {
      // Create single area image
      await createSingleAreaImage(area, page);
    }
  };
  
  const createSingleAreaImage = async (area: any, page: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Load page image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = page.image_url;
    });
    
    // Simple approach - just crop the image without complex watermarking
    canvas.width = area.width;
    canvas.height = area.height;
    
    // Draw cropped article directly
    ctx.drawImage(
      img,
      area.x, area.y, area.width, area.height,
      0, 0, area.width, area.height
    );
    
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setCroppedImage(dataUrl);
    
    console.log('✅ Simple image created - logo will be shown via HTML overlay');
  };
  
  const createCombinedImage = async (mainArea: any, logoUrl: string | null, settings: any) => {
    if (!canvasRef.current) return;
    
    try {
      console.log('🔗 Creating simple combined image with linked areas:', mainArea.linked_area_ids);
      
      // Fetch all linked area maps
      const linkedIds = mainArea.linked_area_ids || [];
      
      // Fetch linked areas in parallel
      const linkedAreasPromises = linkedIds.map(async (areaId: number) => {
        try {
          const response = await fetch(`/api/area-maps/${areaId}?watermark=true`);
          const result = await response.json();
          if (result.success) {
            // Also fetch page data for this area
            const pageResponse = await fetch(`/api/editions/${editionId}/pages/${result.data.page_id}`);
            const pageResult = await pageResponse.json();
            if (pageResult.success) {
              return { area: result.data, page: pageResult.data };
            }
          }
          return null;
        } catch (error) {
          console.error('Failed to fetch linked area:', areaId, error);
          return null;
        }
      });
      
      const linkedAreasData = await Promise.all(linkedAreasPromises);
      const validLinkedAreas = linkedAreasData.filter(Boolean);
      
      // Add main area with its page (fetch if not available)
      let mainPage = pageData;
      if (!mainPage) {
        const pageResponse = await fetch(`/api/editions/${editionId}/pages/${mainArea.page_id}`);
        const pageResult = await pageResponse.json();
        if (pageResult.success) {
          mainPage = pageResult.data;
          setPageData(mainPage); // Update state for future use
        }
      }
      
      const mainAreaWithPage = { area: mainArea, page: mainPage };
      const allAreasWithPages = [mainAreaWithPage, ...validLinkedAreas];
      
      // Sort by page number if available
      allAreasWithPages.sort((a: any, b: any) => {
        const pageA = a.page?.page_number || 0;
        const pageB = b.page?.page_number || 0;
        return pageA - pageB;
      });
      
      console.log('📦 Total areas to combine:', allAreasWithPages.length);
      
      // Create simple combined canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const spacing = 20; // Space between areas
      
      // Load all images first
      const areaImages: Array<{ area: any; page: any; img: HTMLImageElement }> = [];
      
      for (const { area, page } of allAreasWithPages) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            areaImages.push({ area, page, img });
            resolve();
          };
          img.onerror = reject;
          img.src = page.image_url;
        });
      }
      
      // Calculate total height and max width
      let totalHeight = 0;
      let maxWidth = 0;
      
      for (const { area } of areaImages) {
        totalHeight += area.height + spacing;
        maxWidth = Math.max(maxWidth, area.width);
      }
      
      // Set canvas size
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      
      // Draw all areas vertically
      let currentY = 0;
      
      for (const { area, page, img } of areaImages) {
        // Draw the cropped area
        ctx.drawImage(
          img,
          area.x, area.y, area.width, area.height,
          0, currentY, area.width, area.height
        );
        
        currentY += area.height + spacing;
        
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
      setCroppedImage(dataUrl);
      
      console.log('✅ Simple combined image created - logo will be shown via HTML overlay');
    } catch (error) {
      console.error('❌ Failed to create combined image:', error);
      // Fallback to single area - fetch page if needed
      let fallbackPage = pageData;
      if (!fallbackPage) {
        try {
          const pageResponse = await fetch(`/api/editions/${editionId}/pages/${mainArea.page_id}`);
          const pageResult = await pageResponse.json();
          if (pageResult.success) {
            fallbackPage = pageResult.data;
          }
        } catch (err) {
          console.error('Failed to fetch page for fallback:', err);
        }
      }
      if (fallbackPage) {
        await createSingleAreaImage(mainArea, fallbackPage);
      }
    }
  };
  
  // Removed drawLogo function - using HTML overlay instead

  // Double click zoom handler - Toggle zoom at mouse position
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate percentage position
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Set zoom origin to mouse position
    setZoomOrigin({ x: xPercent, y: yPercent });
    
    // Toggle zoom
    setIsZoomed(!isZoomed);
    
    // Reset pan offset when zooming out
    if (isZoomed) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && isZoomed) {
      e.preventDefault();
      e.stopPropagation();
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPanning(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed && e.touches.length === 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setStartPan({ 
        x: e.touches[0].clientX - panOffset.x, 
        y: e.touches[0].clientY - panOffset.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && isZoomed && e.touches.length === 1) {
      e.preventDefault();
      e.stopPropagation();
      setPanOffset({
        x: e.touches[0].clientX - startPan.x,
        y: e.touches[0].clientY - startPan.y
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPanning) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPanning(false);
  };

  // If areaMapId is provided, show cropped image
  if (areaMapId) {
    return (
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {loading ? (
          <div className="flex items-center justify-center p-12 bg-gray-100 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading article...</p>
            </div>
          </div>
        ) : croppedImage ? (
          <div className="relative bg-white rounded shadow-lg overflow-hidden">
            {/* Download Button Only */}
            <div className="absolute top-4 right-4 z-10">
              <a
                href={combinedImage || croppedImage}
                download={`article-with-logo-${areaMapId}.png`}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors inline-block"
                title="Download Article with Logo"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </a>
            </div>
            
            {/* Zoom Hint */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs text-gray-700 font-medium">
                💡 Double-click to {isZoomed ? 'zoom out' : 'zoom in'}
              </p>
            </div>

            {/* COMBINED IMAGE WITH LOGO, INFO TEXT, AND AREA MAP */}
            <div
              ref={containerRef}
              className="overflow-hidden relative bg-white"
              style={{ 
                cursor: isZoomed ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                touchAction: 'none',
                userSelect: 'none',
              }}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {combinedImage ? (
                <img
                  ref={imageRef}
                  src={combinedImage}
                  alt={areaMapData?.title || 'Article with logo'}
                  className="w-full h-auto select-none"
                  draggable={false}
                  style={{
                    transform: `scale(${isZoomed ? 2 : 1}) translate(${panOffset.x / (isZoomed ? 2 : 1)}px, ${panOffset.y / (isZoomed ? 2 : 1)}px)`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: isPanning ? 'none' : 'transform 0.3s ease-out',
                  }}
                />
              ) : croppedImage ? (
                <div className="w-full bg-gray-100 p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Creating combined image with logo...</p>
                </div>
              ) : (
                <div className="w-full bg-gray-50 p-8 text-center">
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>
            
            {/* Article Title */}
            {areaMapData?.title && (
              <div className="p-4 bg-gray-50 border-t">
                <h4 className="text-lg font-semibold text-gray-900">{areaMapData.title}</h4>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
            <p className="text-red-800">Failed to load article image</p>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback if no areaMapId
  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
      )}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h4 className="text-lg font-semibold text-yellow-900 mb-2">No Area Map Selected</h4>
        <p className="text-yellow-700 mb-4">
          This widget needs an areaMapId to display content.
        </p>
      </div>
    </div>
  );
}

/**
 * Replace template placeholders in text (Client-safe version)
 */
function replaceTemplatePlaceholders(text: string, context: any): string {
  let result = text;
  
  // Replace newline placeholder
  result = result.replace(/\{newline\}/g, '\n');
  
  if (context.edition_title) {
    result = result.replace(/\{edition_title\}/g, context.edition_title);
    result = result.replace(/\{page_title\}/g, context.edition_title); // Alias
  }
  if (context.date) {
    result = result.replace(/\{date\}/g, context.date);
  }
  if (context.url) {
    result = result.replace(/\{url\}/g, context.url);
  }
  if (context.page_number) {
    result = result.replace(/\{page_number\}/g, context.page_number.toString());
  }
  if (context.total_pages) {
    result = result.replace(/\{pages\}/g, context.total_pages.toString());
    result = result.replace(/\{total_pages\}/g, context.total_pages.toString()); // Alias
  }
  
  return result;
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