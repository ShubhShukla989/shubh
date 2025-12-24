'use client';

import { useEffect, useState } from 'react';
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

export function EpaperPdfDownloadWidget({ config }: EpaperPdfDownloadWidgetProps) {
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const editionId = (params?.editionId || params?.id) as string;

  useEffect(() => {
    if (editionId) {
      fetchEdition();
    }
  }, [editionId]);

  const fetchEdition = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const data = await response.json();
      if (data.success) {
        setEdition(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch edition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (edition?.pdf_url) {
      const target = config.target === 'new-window' ? '_blank' : '_self';
      window.open(edition.pdf_url, target);
    }
  };

  if (loading) {
    return <div className="text-center py-2">Loading...</div>;
  }

  if (!edition?.pdf_url) {
    return null; // Don't show button if no PDF available
  }

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      <button
        onClick={handleDownload}
        className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs sm:text-sm md:text-base font-medium w-full sm:w-auto"
      >
        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span>{config.buttonText || 'PDF'}</span>
      </button>
      
      {config.title && (
        <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center sm:text-left">{config.title}</p>
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
