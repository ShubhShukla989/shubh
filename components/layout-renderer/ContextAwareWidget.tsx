'use client';

import { useColumnVisibility } from './ColumnVisibilityHelper';
import { parseInlineStyle, sanitizeHtml } from '@/lib/utils/styleParser';
import { useEffect, useState, useMemo } from 'react';
import { EpaperFeaturedWidget } from '../epaper/EpaperFeaturedWidget';
import { FeaturedEditionsWidget } from '../epaper/FeaturedEditionsWidget';
import { SocialWidget } from '../SocialWidget';
import { PageDownloadWidget } from '../page/PageDownloadWidget';
import { NavigationWidget } from '../navigation/NavigationWidget';
import { MenuWidget } from '../MenuWidget';
import HeadingWidget from '../HeadingWidget';

interface ContextAwareWidgetProps {
  widget: {
    type: string;
    config: any;
    id?: string;
    deviceVisibility?: 'both' | 'mobile-only' | 'desktop-only';
  };
  areaMapId?: string;
  editionId?: string;
  pageNumber?: string;
}

export function ContextAwareWidget({ 
  widget, 
  areaMapId, 
  editionId, 
  pageNumber 
}: ContextAwareWidgetProps) {
  const { isWidgetVisible } = useColumnVisibility();
  
  // Memoize visibility check with stable dependencies
  const isVisible = useMemo(() => {
    return isWidgetVisible(widget);
  }, [widget.deviceVisibility, widget.id]); // Use stable widget.id instead of function reference
  
  // Check device visibility
  if (!isVisible) {
    return null; // Don't render if not visible on current device
  }

  return (
    <WidgetRenderer 
      widget={widget}
      areaMapId={areaMapId}
      editionId={editionId}
      pageNumber={pageNumber}
    />
  );
}

function WidgetRenderer({ 
  widget, 
  areaMapId, 
  editionId, 
  pageNumber 
}: ContextAwareWidgetProps) {
  // Render the actual widget
  return renderWidget(widget, areaMapId, editionId, pageNumber);
}

function renderWidget(widget: any, areaMapId?: string, editionId?: string, pageNumber?: string) {
  switch (widget.type) {
    case 'image':
      const imgStyle = parseInlineStyle(widget.config.style);
      
      const imgElement = (
        <img
          src={widget.config.src}
          alt={widget.config.alt || ''}
          title={widget.config.title || ''}
          loading={widget.config.lazyload !== false ? 'lazy' : 'eager'}
          className={widget.config.cssClasses || ''}
          style={{
            display: 'block', // Make image block element for margin auto to work
            ...imgStyle
          }}
        />
      );
      
      // If there's a link, wrap in anchor tag - NO CENTERING WRAPPER
      if (widget.config.link) {
        return (
          <a 
            href={widget.config.link} 
            target={widget.config.target || '_self'}
            className={widget.config.cssClasses || ''}
            style={{ display: 'inline-block' }}
          >
            {imgElement}
          </a>
        );
      }
      
      // DIRECT IMAGE RENDERING - NO CENTERING WRAPPER
      return imgElement;

    case 'text':
    case 'html':
      return (
        <div 
          className={widget.config.cssClasses || ''}
          style={parseInlineStyle(widget.config.style)}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(widget.config.content || widget.config.html) }} 
        />
      );

    case 'heading':
      return <HeadingWidgetRenderer 
        widget={widget} 
        editionId={editionId} 
        pageNumber={pageNumber} 
      />;

    case 'button':
      return (
        <a
          href={widget.config.link || '#'}
          className={`inline-block px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm md:text-base font-medium text-center transition-colors ${
            widget.config.style === 'secondary' 
              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${widget.config.cssClasses || ''}`}
          style={parseInlineStyle(widget.config.style)}
        >
          {widget.config.text}
        </a>
      );

    case 'social':
      return <SocialWidget config={widget.config} />;

    case 'page-download':
      return <PageDownloadWidget config={widget.config} />;

    case 'epaper-featured':
      return <EpaperFeaturedWidget config={widget.config} />;

    case 'epaper-category':
      return <EpaperFeaturedWidget config={widget.config} />;

    case 'featured-editions':
      return <FeaturedEditionsWidget config={widget.config} />;

    case 'menu':
      return <MenuWidget config={widget.config} />;

    case 'navigation':
      return <NavigationWidget config={widget.config} />;

    case 'heading-widget':
      return <HeadingWidget 
        config={widget.config}
        className={widget.config.cssClasses || ''}
      />;

    default:
      return (
        <div className="p-4 bg-gray-50 border border-gray-200">
          <p className="text-gray-600 text-sm">Unknown widget type: {widget.type}</p>
        </div>
      );
  }
}

// Helper function to get edition title
async function fetchEditionTitle(editionId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/editions/${editionId}/title`);
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.title : null;
    }
  } catch (error) {
    // Handle API error silently
  }
  return null;
}

function getEditionTitle(editionId: string): string | null {
  // Try to get from page title or URL
  const urlPath = window.location.pathname;
  
  // Check if we're on an epaper view page OR category page with edition
  if (urlPath.includes('/epaper/view/') || urlPath.includes('/epaper/category/')) {
    // Try to extract from document title
    const title = document.title;
    if (title && title !== 'Epaper CMS') {
      // Remove common suffixes
      return title.replace(/ - Epaper CMS$/, '').replace(/ - Page \d+.*$/, '').replace(/ Archive$/, '');
    }
  }
  
  // Fallback: return null so we can fetch from API
  return null;
}

// Helper function to get category name from URL
function getCategoryFromURL(): string | null {
  const urlPath = window.location.pathname;
  
  // Check if we're on a category archive page
  if (urlPath.includes('/epaper/category/')) {
    // Try to extract from document title
    const title = document.title;
    if (title && title !== 'Epaper CMS') {
      // Remove common suffixes
      return title.replace(/ - Epaper CMS$/, '').replace(/ Archive$/, '');
    }
    
    // Fallback: extract from URL
    const categoryAlias = urlPath.split('/epaper/category/')[1]?.split('/')[0];
    if (categoryAlias) {
      // Convert alias to readable name (capitalize and replace hyphens)
      return categoryAlias.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  return null;
}

// Separate component for heading widget with state management
function HeadingWidgetRenderer({ 
  widget, 
  editionId, 
  pageNumber 
}: { 
  widget: any; 
  editionId?: string; 
  pageNumber?: string; 
}) {
  const [editionTitle, setEditionTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Get context-aware heading text
  const getContextAwareHeading = () => {
    // If custom title is provided, use it
    if (widget.config.title && widget.config.title.trim()) {
      return widget.config.title;
    }
    
    // Only access browser APIs on client side
    if (typeof window === 'undefined') {
      return widget.config.text || 'Archive';
    }
    
    const urlPath = window.location.pathname;
    
    // Check if we're on an epaper display page (has editionId in URL)
    const currentEditionId = editionId || window.location.pathname.split('/').pop();
    const isEpaperDisplayPage = urlPath.includes('/epaper/view/') || 
                               (urlPath.includes('/epaper/category/') && currentEditionId && !isNaN(Number(currentEditionId)));
    
    if (isEpaperDisplayPage) {
      // For epaper display: show "Edition Title - Date - Page X"
      const urlParams = new URLSearchParams(window.location.search);
      const currentPage = parseInt(urlParams.get('page') || '1');
      
      const title = editionTitle || getEditionTitle(currentEditionId || '') || 'Edition';
      
      // Format date like "28 Dec 2025"
      const today = new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      
      return `${title} - ${today} - Page ${currentPage}`;
    }
    
    // Check if we're on a category archive page (no edition ID)
    const categoryName = getCategoryFromURL();
    if (categoryName) {
      return categoryName;
    }
    
    // Fallback to page title or default
    return document.title || widget.config.text || 'Archive';
  };

  // Fetch edition title when component mounts
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const fetchTitle = async () => {
      if (typeof window === 'undefined') return;
      
      const urlPath = window.location.pathname;
      const currentEditionId = editionId || window.location.pathname.split('/').pop();
      const isEpaperDisplayPage = urlPath.includes('/epaper/view/') || 
                                 (urlPath.includes('/epaper/category/') && currentEditionId && !isNaN(Number(currentEditionId)));
      
      if (isEpaperDisplayPage && currentEditionId && !isNaN(Number(currentEditionId))) {
        // First try to get from document title
        const titleFromDoc = getEditionTitle(currentEditionId);
        if (titleFromDoc && isMounted) {
          setEditionTitle(titleFromDoc);
          return;
        }
        
        // If not found, fetch from API
        if (isMounted) setLoading(true);
        try {
          const response = await fetch(`/api/editions/${currentEditionId}/title`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && isMounted) {
              setEditionTitle(data.title);
            }
          }
        } catch (error) {
          // Handle API error silently
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };

    fetchTitle();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [editionId]);
  
  // Check if we should show underlined part
  const shouldShowUnderline = () => {
    // Always show solid red line, no text
    return false; // Never show text, always just solid line
  };
  
  const headingText = getContextAwareHeading();
  const showUnderline = shouldShowUnderline();
  
  // Apply HeadingWidget styling to regular heading widget
  return (
    <div className={`${widget.config.cssClasses || ''}`} style={parseInlineStyle(widget.config.style)}>
      {/* Main heading - bold - responsive font size */}
      <h2 style={{ 
        fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', // Responsive font size
        fontWeight: 'bold', 
        color: '#111827', 
        marginBottom: '0.5rem',
        lineHeight: '1.2',
        wordBreak: 'break-word', // Handle long titles on mobile
        hyphens: 'auto'
      }}>
        {loading ? 'Loading...' : headingText}
      </h2>
      
      {/* Red solid underline - always full width, responsive height */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{
          flex: '1',
          height: 'clamp(1px, 0.5vw, 2px)', // Responsive line height
          backgroundColor: '#dc2626',
          width: '100%',
          minHeight: '1px' // Ensure visibility on very small screens
        }}></div>
      </div>
    </div>
  );
}