'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PageDownloadWidgetProps {
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

export function PageDownloadWidget({ config }: PageDownloadWidgetProps) {
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
    return null;
  }

  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      <button
        onClick={handleDownload}
        className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm md:text-base"
      >
        <span>{config.buttonText || 'PDF'}</span>
      </button>
      
      {config.title && (
        <p className="text-sm text-gray-600 mt-2">{config.title}</p>
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
