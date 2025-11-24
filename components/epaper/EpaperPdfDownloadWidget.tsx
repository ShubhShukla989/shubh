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
  const editionId = params?.id as string;

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
      {config.title && (
        <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
      )}

      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg font-medium"
      >
        {/* PDF Icon */}
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        
        <span>{config.buttonText || 'PDF'}</span>
      </button>
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
