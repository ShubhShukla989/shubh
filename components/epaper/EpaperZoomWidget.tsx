'use client';

import { useEpaper } from '@/contexts/EpaperContext';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface EpaperZoomWidgetProps {
  config: {
    title?: string;
    showLabels?: boolean;
    orientation?: 'horizontal' | 'vertical';
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperZoomWidget({ config }: EpaperZoomWidgetProps) {
  const { zoom, setZoom } = useEpaper();

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  const orientation = config.orientation || 'horizontal';
  const showLabels = config.showLabels !== false;

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{config.title}</h3>
      )}

      <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} gap-1 sm:gap-2`}>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          {showLabels && <span className="hidden sm:inline">Zoom Out</span>}
        </button>

        <button
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
          title="Reset Zoom"
        >
          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          {showLabels && <span>{Math.round(zoom * 100)}%</span>}
        </button>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 2}
          className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          {showLabels && <span className="hidden sm:inline">Zoom In</span>}
        </button>
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
