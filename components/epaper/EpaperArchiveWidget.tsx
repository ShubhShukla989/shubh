'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCategory } from '@/contexts/CategoryContext';

interface EpaperArchiveWidgetProps {
  config: {
    title?: string;
    perRowCount?: number;
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    format?: 'normal-thumbnail' | 'cropped-thumbnail' | 'thumb-image-as-background';
    cssClasses?: string;
    style?: string;
  };
}

interface Page {
  id: number;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  title: string;
}

interface Edition {
  id: number;
  title: string;
  date: string;
  category_id: number;
  status: string;
  pages: Page[];
}

export function EpaperArchiveWidget({ config }: EpaperArchiveWidgetProps) {
  const { categoryId } = useCategory();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEditions();
  }, [categoryId]);

  const fetchEditions = async () => {
    try {
      let url = '/api/editions?status=published';
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEditions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching editions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (editions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No editions found for this category.
      </div>
    );
  }

  const perRow = config.perRowCount || 3;
  const thumbWidth = config.thumbnailWidth || 300;
  const thumbHeight = config.thumbnailHeight || 400;
  const format = config.format || 'thumb-image-as-background';

  return (
    <div className={`epaper-archive-widget ${config.cssClasses || ''}`} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{config.title}</h2>
      )}
      
      <div 
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${perRow}, 1fr)`,
        }}
      >
        {editions.map((edition) => {
          // Get first page image
          const firstPage = edition.pages && edition.pages.length > 0 ? edition.pages[0] : null;
          const thumbnailUrl = firstPage?.image_url || '/placeholder.png';
          
          return (
            <Link
              key={edition.id}
              href={`/epaper/view/${edition.id}`}
              className="block group"
              title={`View ${edition.title}`}
            >
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative overflow-hidden" style={{ paddingBottom: '133%' }}>
                  <img
                    src={thumbnailUrl}
                    alt={edition.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 text-center bg-white border-t border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-base mb-1 group-hover:text-blue-600 transition-colors">
                    {edition.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(edition.date).toLocaleDateString('en-IN', { 
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
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
