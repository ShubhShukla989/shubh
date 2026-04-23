'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';

interface EpaperPdfDownloadWidgetProps {
  config: {
    title?: string;
    buttonText?: string;
    target?: 'same-window' | 'new-window';
    cssClasses?: string;
    style?: string;
  };
}

interface Edition {
  id: number;
  pdf_url?: string;
  title: string;
}

// Memoize style parser
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

export function EpaperPdfDownloadWidget({ config }: EpaperPdfDownloadWidgetProps) {
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const editionId = (params?.editionId || params?.id) as string;

  // Memoize parsed styles
  const parsedStyles = useMemo(() => parseInlineStyle(config.style), [config.style]);

  const fetchEdition = useCallback(async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const data = await response.json();
      if (data.success) {
        setEdition(data.data);
      }
    } catch (error) {
      // Silent fail - error handled by loading state
    } finally {
      setLoading(false);
    }
  }, [editionId]);

  useEffect(() => {
    if (editionId) {
      fetchEdition();
    }
  }, [editionId, fetchEdition]);

  const handleDownload = useCallback(() => {
    if (edition?.pdf_url) {
      const target = config.target === 'new-window' ? '_blank' : '_self';
      window.open(edition.pdf_url, target);
    }
  }, [edition?.pdf_url, config.target]);

  if (loading || !edition?.pdf_url) {
    return null;
  }

  return (
    <div className={config.cssClasses || ''} style={parsedStyles}>
      <button
        onClick={handleDownload}
        className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white hover:bg-red-700 transition-colors text-xs sm:text-sm md:text-base font-medium w-full sm:w-auto"
        aria-label="Download PDF"
      >
        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" opacity="0.7"/>
        </svg>
        <span>PDF</span>
      </button>
      
      {config.title && (
        <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center sm:text-left">{config.title}</p>
      )}
    </div>
  );
}
