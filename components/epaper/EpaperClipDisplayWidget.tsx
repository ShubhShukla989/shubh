'use client';

import { useState, useEffect, useRef } from 'react';
import { Download } from 'lucide-react';

interface EpaperClipDisplayWidgetProps {
  config: {
    title?: string;
    showImage?: boolean;
    showUrl?: boolean;
    cssClasses?: string;
    style?: string;
  };
}

// Safe hook for ClipContext
function useClipSafe() {
  try {
    // Dynamic import to avoid build errors if ClipContext is not available
    const { useClip } = require('@/contexts/ClipContext');
    return useClip();
  } catch {
    return null;
  }
}

export function EpaperClipDisplayWidget({ config }: EpaperClipDisplayWidgetProps) {
  const clipContext = useClipSafe();
  
  // If no clip context, show placeholder
  if (!clipContext) {
    return (
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h4 className="text-lg font-semibold mb-3">{config.title}</h4>
        )}
        <div className="p-6 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-center">
          <div className="text-4xl mb-2">✂️</div>
          <div className="text-blue-600 font-medium">Clip Display Widget</div>
          <div className="text-blue-500 text-sm mt-1">
            Clipped content will appear here when available
          </div>
        </div>
      </div>
    );
  }

  const { clipImage, clipUrl, editionId, setCombinedImage: setContextCombinedImage } = clipContext;
  const [categoryLogoUrl, setCategoryLogoUrl] = useState<string | null>(null);
  const [watermarkSettings, setWatermarkSettings] = useState<any>(null);
  const [editionData, setEditionData] = useState<any>(null);
  const [combinedImage, setCombinedImage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showImage = config.showImage !== false;
  const showUrl = config.showUrl !== false;

  // Create combined image with logo, info text, and clip
  const createCombinedClipImage = async () => {
    if (!clipImage || !canvasRef.current) return;

    try {
      console.log('🎨 Creating combined clip image...');
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load clip image
      const clipImg = new Image();
      clipImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        clipImg.onload = () => resolve();
        clipImg.onerror = reject;
        clipImg.src = clipImage;
      });

      // Calculate dimensions
      const clipWidth = clipImg.width;
      const clipHeight = clipImg.height;
      const headerHeight = Math.max(100, clipHeight * 0.2); // 20% of clip height, minimum 100px
      
      // Set canvas size
      canvas.width = clipWidth;
      canvas.height = clipHeight + headerHeight;

      // Draw header background
      ctx.fillStyle = watermarkSettings?.background_color || '#f9fafb';
      ctx.fillRect(0, 0, clipWidth, headerHeight);

      // Draw border if enabled
      if (watermarkSettings?.enable_border) {
        ctx.strokeStyle = watermarkSettings?.border_color || '#e5e7eb';
        ctx.lineWidth = watermarkSettings?.border_width || 2;
        ctx.strokeRect(0, 0, clipWidth, clipHeight + headerHeight);
      }

      // Draw border at bottom of header
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(clipWidth, headerHeight);
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
              const logoX = (clipWidth - logoWidth) / 2;
              const logoY = 10;
              
              ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
              console.log('✅ Logo drawn in combined clip');
              resolve();
            };
            
            logo.onerror = () => {
              clearTimeout(timeout);
              console.error('❌ Logo failed to load in combined clip');
              resolve();
            };
            
            logo.src = categoryLogoUrl;
          });
        } catch (error) {
          console.error('❌ Error loading logo for combined clip:', error);
        }
      }

      // Draw info text using watermark settings ONLY
      if (watermarkSettings?.info_text && watermarkSettings.info_text.trim()) {
        const processedText = watermarkSettings.info_text
          .replace(/\{newline\}/g, '\n')
          .replace(/\{edition_title\}/g, editionData?.title || '')
          .replace(/\{date\}/g, editionData?.date ? new Date(editionData.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short', 
            year: 'numeric'
          }) : '')
          .replace(/\{url\}/g, clipUrl || '');

        if (processedText.trim()) {
          ctx.fillStyle = watermarkSettings.foreground_color || '#1f2937';
          ctx.textAlign = 'center';
          ctx.font = '14px Arial';
          
          const lines = processedText.split('\n');
          const lineHeight = 18;
          const logoHeight = headerHeight * 0.6;
          const textStartY = 10 + logoHeight + 20; // Below logo
          
          lines.forEach((line: string, index: number) => {
            if (line.trim()) {
              ctx.fillText(line.trim(), clipWidth / 2, textStartY + (index * lineHeight));
            }
          });
          
          console.log('✅ Info text drawn in combined clip');
        }
      }
      // NO FALLBACK TEXT - If no watermark settings, show no text

      // Draw clip image
      ctx.drawImage(clipImg, 0, headerHeight, clipWidth, clipHeight);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setCombinedImage(dataUrl); // Set in local state for display
      setContextCombinedImage(dataUrl); // Set in context for ShareModal
      
      console.log('✅ Combined clip image created successfully');
    } catch (error) {
      console.error('❌ Error creating combined clip image:', error);
    }
  };

  // Create combined image when data is ready
  useEffect(() => {
    if (clipImage && (categoryLogoUrl || watermarkSettings)) {
      createCombinedClipImage();
    }
  }, [clipImage, categoryLogoUrl, watermarkSettings, editionData]);

  // Fetch watermark settings for clip display
  useEffect(() => {
    const fetchWatermarkSettings = async () => {
      if (!editionId) return;

      try {
        // Fetch edition to get category_id
        const editionResponse = await fetch(`/api/editions/${editionId}`);
        const editionResult = await editionResponse.json();
        
        if (editionResult.success && editionResult.data) {
          const edition = editionResult.data;
          setEditionData(edition);
          
          if (edition.category_id) {
            const categoryId = edition.category_id;
            
            // Try category-specific settings first
            const categoryResponse = await fetch(`/api/settings/category-watermark?category_id=${categoryId}`);
            const categoryResult = await categoryResponse.json();
            
            let finalSettings = null;
            let logoUrl = null;
            
            // Check if category has custom settings with logo
            if (categoryResult.success && categoryResult.data) {
              const data = categoryResult.data;
              
              if (data.enable_watermarking && (data.logo_url || data.center_watermark_url)) {
                finalSettings = data;
                logoUrl = data.logo_url || data.center_watermark_url;
                console.log('✅ Using category-specific watermark settings for clip');
              }
            }
            
            // Fallback to global area map watermark settings
            if (!finalSettings || !logoUrl) {
              const globalResponse = await fetch('/api/settings/area-map-watermark');
              const globalResult = await globalResponse.json();
              
              if (globalResult.success && globalResult.data) {
                const globalData = globalResult.data;
                
                if (globalData.enable_watermarking && (globalData.logo_url || globalData.center_watermark_url)) {
                  finalSettings = globalData;
                  logoUrl = globalData.logo_url || globalData.center_watermark_url;
                  console.log('✅ Using global watermark settings for clip');
                }
              }
            }
            
            // Set final settings and logo
            if (finalSettings && logoUrl) {
              setWatermarkSettings(finalSettings);
              setCategoryLogoUrl(logoUrl);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching watermark settings for clip:', error);
      }
    };

    fetchWatermarkSettings();
  }, [editionId]);

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h4 className="text-lg font-semibold mb-3">{config.title}</h4>
      )}

      {/* Combined Image with Logo and Info Text - CANVAS APPROACH */}
      {showImage && (
        <div className="mb-4 relative" key={combinedImage ? 'combined' : 'loading'}>
          <canvas 
            ref={canvasRef}
            className="w-full rounded-lg border border-gray-200 shadow-sm"
            style={{ display: 'none' }}
          />
          
          {/* Download Button - Only show when combined image is ready */}
          {combinedImage && (
            <div className="absolute top-4 right-4 z-10">
              <a
                href={combinedImage}
                download={`clip-with-logo-${Date.now()}.png`}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors inline-block"
                title="Download Clip with Logo"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </a>
            </div>
          )}
          
          {/* SINGLE IMAGE DISPLAY - No overlapping */}
          {combinedImage ? (
            <>
              {console.log('🖼️ Rendering FINAL COMBINED image - hiding all other states')}
              <img
                key="combined-image"
                src={combinedImage}
                alt="Clipped article with logo"
                className="w-full rounded-lg border border-gray-200 shadow-sm"
                style={{ display: 'block' }} // Force display
              />
            </>
          ) : clipImage ? (
            <>
              {console.log('⏳ Showing LOADING state - combined image not ready yet')}
              <div 
                key="loading-state"
                className="w-full rounded-lg border border-gray-200 shadow-sm bg-gray-100 p-4 text-center"
                style={{ display: 'block' }} // Force display
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Creating combined image...</p>
              </div>
            </>
          ) : (
            <>
              {console.log('❌ No clip image available')}
              <div 
                key="no-image"
                className="w-full rounded-lg border border-gray-200 shadow-sm bg-gray-50 p-8 text-center"
                style={{ display: 'block' }} // Force display
              >
                <p className="text-gray-500">No clip image available</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL Box */}
      {showUrl && (
        <div className="mb-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-red-500 rounded-lg">
            <input
              type="text"
              value={clipUrl || ''}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      )}
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
