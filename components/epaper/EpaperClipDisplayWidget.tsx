'use client';

import { useClip } from '@/contexts/ClipContext';

interface EpaperClipDisplayWidgetProps {
  config: {
    title?: string;
    showImage?: boolean;
    showUrl?: boolean;
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperClipDisplayWidget({ config }: EpaperClipDisplayWidgetProps) {
  const { clipImage, clipUrl } = useClip();

  const showImage = config.showImage !== false;
  const showUrl = config.showUrl !== false;

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h4 className="text-lg font-semibold mb-3">{config.title}</h4>
      )}

      {/* Clipped Image */}
      {showImage && clipImage && (
        <div className="mb-4">
          <img
            src={clipImage}
            alt="Clipped article"
            className="w-full rounded-lg border border-gray-200 shadow-sm"
          />
        </div>
      )}

      {/* URL Box */}
      {showUrl && (
        <div className="mb-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-red-500 rounded-lg">
            <input
              type="text"
              value={clipUrl}
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
