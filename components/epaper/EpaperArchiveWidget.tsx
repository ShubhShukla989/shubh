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
  const { categoryId, categoryTitle } = useCategory();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      {/* Header with Category Title and Underline */}
      <div className="mb-8 px-4 md:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {categoryTitle || config.title || 'Archive'}
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
      </div>
      
      <div 
        className="grid gap-4 md:gap-6 px-4 md:px-8"
        style={{
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${perRow}, 1fr)`,
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
              <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-red-500">
                <div className="relative overflow-hidden" style={{ paddingBottom: '133%' }}>
                  <img
                    src={thumbnailUrl}
                    alt={edition.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 md:p-4 text-center bg-white border-t-2 border-gray-200">
                  <h3 className="font-bold text-gray-900 text-xs md:text-base mb-1 group-hover:text-red-600 transition-colors leading-tight">
                    {edition.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 font-medium">
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
