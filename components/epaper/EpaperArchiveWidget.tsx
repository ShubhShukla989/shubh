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
  const [isClient, setIsClient] = useState(false);

  // Client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    if (isClient) {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [isClient]);

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
  
  // Simple, reliable sizing
  const getCardDimensions = () => {
    if (isMobile) {
      return {
        width: 350,
        height: 500
      };
    } else {
      return {
        width: config.thumbnailWidth || 280,
        height: config.thumbnailHeight || 380
      };
    }
  };
  
  const { width: cardWidth, height: cardHeight } = getCardDimensions();
  const format = config.format || 'thumb-image-as-background';

  return (
    <div className={`epaper-archive-widget ${config.cssClasses || ''}`} style={{...parseInlineStyle(config.style), width: '100%', maxWidth: '100%'}}>
      <div 
        className="archive-cards-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '8px',
          width: '100%',
          boxSizing: 'border-box'
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
              className="archive-card-link"
              title={`View ${edition.title}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                flexShrink: 0
              }}
            >
              <div 
                className="archive-card"
                style={{
                  width: `${cardWidth}px !important`,
                  height: `${cardHeight}px !important`,
                  backgroundColor: 'white',
                  border: '4px solid #1f2937',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = '#1f2937';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                }}
              >
                <div 
                  className="card-image"
                  style={{ 
                    width: '100%',
                    height: `${cardHeight * 0.8}px`,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <img
                    src={thumbnailUrl}
                    alt={edition.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </div>
                <div 
                  className="card-content"
                  style={{
                    height: `${cardHeight * 0.2}px`,
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderTop: '4px solid #1f2937',
                    backgroundColor: 'white'
                  }}
                >
                  <h3 
                    style={{ 
                      fontSize: `${Math.max(10, cardWidth / 25)}px`,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: '0 0 4px 0',
                      lineHeight: '1.2',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {edition.title}
                  </h3>
                  <p 
                    style={{ 
                      fontSize: `${Math.max(8, cardWidth / 35)}px`,
                      color: '#6b7280',
                      margin: '0',
                      fontWeight: '500'
                    }}
                  >
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
