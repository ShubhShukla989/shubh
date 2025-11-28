'use client';

import { useState, useRef, useEffect } from 'react';
import { useEpaper } from '@/contexts/EpaperContext';
import { Download } from 'lucide-react';

interface EpaperAreaMapDisplayWidgetProps {
  config: {
    title?: string;
    cssClasses?: string;
    style?: string;
  };
  areaMapId?: string;
  editionId?: string;
  pageNumber?: string;
}

export function EpaperAreaMapDisplayWidget({ config, areaMapId, editionId: propEditionId, pageNumber: propPageNumber }: EpaperAreaMapDisplayWidgetProps) {
  const { editionId: contextEditionId } = useEpaper();
  const editionId = propEditionId || contextEditionId;
  
  const [areaMapData, setAreaMapData] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 }); // Percentage
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch area map data and create cropped image
  useEffect(() => {
    if (!areaMapId || !editionId) return;
    
    const fetchAndCropImage = async () => {
      try {
        setLoading(true);
        
        // Fetch area map data
        const areaResponse = await fetch(`/api/area-maps/${areaMapId}`);
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
        
        // Create cropped image
        await createCroppedImage(areaData, page);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching area map:', error);
        setLoading(false);
      }
    };
    
    fetchAndCropImage();
  }, [areaMapId, editionId]);
  
  const createCroppedImage = async (area: any, page: any) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Check if area has linked areas
    const hasLinkedAreas = area.linked_area_ids && area.linked_area_ids.length > 0;
    
    if (hasLinkedAreas) {
      // Create combined image with linked areas
      await createCombinedImage(area);
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
    
    const headerHeight = 200;
    
    // Set canvas size
    canvas.width = area.width;
    canvas.height = area.height + headerHeight;
    
    // Draw header background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, area.width, headerHeight);
    
    // Draw border at bottom of header
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, headerHeight);
    ctx.lineTo(area.width, headerHeight);
    ctx.stroke();
    
    // Draw logo
    await drawLogo(ctx, area.width, headerHeight);
    
    // Draw text
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${window.location.origin}/epaper/view/${editionId}`, area.width / 2, headerHeight - 40);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Page ${propPageNumber || ''}`, area.width / 2, headerHeight - 20);
    
    // Draw cropped article
    ctx.drawImage(
      img,
      area.x, area.y, area.width, area.height,
      0, headerHeight, area.width, area.height
    );
    
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setCroppedImage(dataUrl);
  };
  
  const createCombinedImage = async (mainArea: any) => {
    if (!canvasRef.current) return;
    
    try {
      console.log('🔗 Creating combined image with linked areas:', mainArea.linked_area_ids);
      
      // Fetch all linked area maps
      const linkedIds = mainArea.linked_area_ids || [];
      
      // Fetch linked areas in parallel
      const linkedAreasPromises = linkedIds.map(async (areaId: number) => {
        try {
          const response = await fetch(`/api/area-maps/${areaId}`);
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
      
      // Create combined canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const headerHeight = 200;
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
      let totalHeight = headerHeight;
      let maxWidth = 0;
      
      for (const { area } of areaImages) {
        totalHeight += area.height + spacing;
        maxWidth = Math.max(maxWidth, area.width);
      }
      
      // Set canvas size
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      
      // Draw header background
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, maxWidth, headerHeight);
      
      // Draw border at bottom of header
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(maxWidth, headerHeight);
      ctx.stroke();
      
      // Draw logo
      await drawLogo(ctx, maxWidth, headerHeight);
      
      // Draw text
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${window.location.origin}/epaper/view/${editionId}`, maxWidth / 2, headerHeight - 40);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#6b7280';
      const pageNumbers = allAreasWithPages.map((a: any) => a.page?.page_number || '').filter(Boolean).join(', ');
      ctx.fillText(`Pages: ${pageNumbers}`, maxWidth / 2, headerHeight - 20);
      
      // Draw all areas vertically
      let currentY = headerHeight;
      
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
      
      console.log('✅ Combined image created successfully');
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
  
  const drawLogo = async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const mediaResponse = await fetch('/api/media');
      const mediaData = await mediaResponse.json();
      
      if (mediaData.success && mediaData.data) {
        const logoFile = mediaData.data.find((file: any) => {
          const title = file.title?.toLowerCase() || '';
          const name = file.name?.toLowerCase() || '';
          return title === 'logo' || name.includes('logo');
        });
        
        if (logoFile?.url) {
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 2000);
            logo.onload = () => {
              clearTimeout(timeout);
              const logoHeight = height * 0.75;
              const logoWidth = (logo.width / logo.height) * logoHeight;
              const logoX = (width - logoWidth) / 2;
              const logoY = 15;
              ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
              resolve();
            };
            logo.onerror = () => {
              clearTimeout(timeout);
              resolve();
            };
            logo.src = logoFile.url;
          });
        }
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  };

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
                href={croppedImage}
                download={`article-${areaMapId}.png`}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors inline-block"
                title="Download"
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
            
            {/* Image Container */}
            <div
              ref={containerRef}
              className="overflow-hidden relative"
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
              <img
                ref={imageRef}
                src={croppedImage}
                alt={areaMapData?.title || 'Article'}
                className="w-full h-auto select-none"
                draggable={false}
                style={{
                  transform: `scale(${isZoomed ? 2 : 1}) translate(${panOffset.x / (isZoomed ? 2 : 1)}px, ${panOffset.y / (isZoomed ? 2 : 1)}px)`,
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  transition: isPanning ? 'none' : 'transform 0.3s ease-out',
                }}
              />
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
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center">
        <p className="text-yellow-800">
          <strong>No Area Map Selected</strong><br />
          Please click on an area map to view the article.
        </p>
      </div>
    </div>
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
