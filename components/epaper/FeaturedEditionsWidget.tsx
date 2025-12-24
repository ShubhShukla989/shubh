'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edition } from '@/lib/types';

interface FeaturedEditionsWidgetProps {
  config: {
    title?: string;
    maxEditions?: number;
    showDate?: boolean;
    showDescription?: boolean;
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    perRowCount?: number;
    cssClasses?: string;
    style?: string;
  };
}

export function FeaturedEditionsWidget({ config }: FeaturedEditionsWidgetProps) {
  const [editions, setEditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedEditions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/editions/featured', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        const maxEditions = config.maxEditions || 10;
        setEditions(result.data.slice(0, maxEditions));
      } else {
        setError(result.error || 'Failed to fetch featured editions');
      }
    } catch (error) {
      console.error('Failed to fetch featured editions:', error);
      setError('Failed to fetch featured editions');
    } finally {
      setLoading(false);
    }
  }, [config.maxEditions]);

  useEffect(() => {
    fetchFeaturedEditions();
  }, [fetchFeaturedEditions]);

  const getThumbnailUrl = useCallback((edition: any) => {
    // Try to get the first page thumbnail
    if (edition.pages && edition.pages.length > 0) {
      return edition.pages[0].thumb_url || edition.pages[0].image_url;
    }
    
    // Fallback to a default thumbnail path
    return `/media/epaper/${edition.id}/page-1-thumb.jpg`;
  }, []);

  if (loading) {
    return (
      <div className={`featured-editions-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
        <div className="text-center py-8 text-gray-500">Loading featured editions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`featured-editions-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
        <div className="text-center py-8 text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (editions.length === 0) {
    return (
      <div className={`featured-editions-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
        {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
        <div className="text-center py-8 text-gray-500">No featured editions found</div>
      </div>
    );
  }

  const { thumbnailWidth, thumbnailHeight, perRowCount } = useMemo(() => ({
    thumbnailWidth: config.thumbnailWidth || 200,
    thumbnailHeight: config.thumbnailHeight || 280,
    perRowCount: config.perRowCount || 3,
  }), [config.thumbnailWidth, config.thumbnailHeight, config.perRowCount]);

  return (
    <div className={`featured-editions-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
      {config.title && <h2 className="text-2xl font-bold mb-6">{config.title}</h2>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {editions.map((edition: any) => (
          <div key={edition.id} className="featured-edition-card bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <Link href={`/epaper/view/${edition.id}`} className="block">
              <div className="relative overflow-hidden rounded-t-lg">
                <Image
                  src={getThumbnailUrl(edition)}
                  alt={edition.title}
                  width={thumbnailWidth}
                  height={thumbnailHeight}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback to a placeholder image
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/epaper-placeholder.svg';
                  }}
                />
                
                {/* Featured Badge */}
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  ⭐ Featured
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2">{edition.title}</h3>
                
                {config.showDate && (
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(edition.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
                
                {config.showDescription && edition.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{edition.description}</p>
                )}
                
                <div className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-800">
                  Read Edition →
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {editions.length > 0 && (
        <div className="text-center mt-8">
          <Link 
            href="/epaper/archive" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Editions
          </Link>
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