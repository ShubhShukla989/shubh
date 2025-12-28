'use client';

import { useState, useEffect } from 'react';
// Removed EpaperContext import - working independently now

interface EpaperClipShareWidgetProps {
  config: {
    title?: string;
    buttonText?: string;
    zoomable?: boolean;
    dragMode?: 'none' | 'crop' | 'move';
    shareButtonPosition?: 'stick-to-crop-area';
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperClipShareWidget({ config }: EpaperClipShareWidgetProps) {
  // Work independently with local state
  const [isClipping, setIsClipping] = useState(false);

  // Listen for clipping completion to reset state
  useEffect(() => {
    const handleClipComplete = () => {
      setIsClipping(false);
      console.log('✅ Clipping completed, resetting clip button state');
    };
    
    const handleClipCancel = () => {
      setIsClipping(false);
      console.log('❌ Clipping cancelled, resetting clip button state');
    };
    
    window.addEventListener('clipcomplete', handleClipComplete as EventListener);
    window.addEventListener('clipcancel', handleClipCancel as EventListener);
    
    return () => {
      window.removeEventListener('clipcomplete', handleClipComplete as EventListener);
      window.removeEventListener('clipcancel', handleClipCancel as EventListener);
    };
  }, []);

  const handleClipClick = () => {
    const newClippingState = !isClipping;
    setIsClipping(newClippingState);
    
    // Notify EpaperPageDisplayWidget about clipping state change
    window.dispatchEvent(new CustomEvent('clippingchange', { 
      detail: { isClipping: newClippingState } 
    }));
    
    console.log('🎯 Clip button clicked, clipping:', newClippingState);
  };

  const shareButtonPosition = config.shareButtonPosition || 'stick-to-crop-area';
  const isFixed = false; // Disabled fixed positioning to remove bottom right popup

  return (
    <div 
      className={`${config.cssClasses || ''} ${isFixed ? 'fixed bottom-4 right-4 z-50' : ''}`} 
      style={parseInlineStyle(config.style)}
    >
      {config.title && !isFixed && (
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{config.title}</h3>
      )}

      <button
        onClick={handleClipClick}
        className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all shadow-md hover:shadow-lg font-medium text-xs sm:text-sm ${
          isClipping 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        dangerouslySetInnerHTML={{ 
          __html: config.buttonText || '<i class="fas fa-cut"></i> Clip' 
        }}
      />
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
