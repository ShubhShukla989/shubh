'use client';

import { useEpaperSafe } from '@/contexts/EpaperContext';
import { useColumnVisibility } from './ColumnVisibilityHelper';
import { EpaperArchiveWidget } from '../epaper/EpaperArchiveWidget';
import { EpaperCalendarWidget } from '../epaper/EpaperCalendarWidget';
import { EpaperPaginationWidget } from '../epaper/EpaperPaginationWidget';
import { EpaperPdfDownloadWidget } from '../epaper/EpaperPdfDownloadWidget';
import { EpaperThumbNavigationWidget } from '../epaper/EpaperThumbNavigationWidget';
import { EpaperClipShareWidget } from '../epaper/EpaperClipShareWidget';
import { EpaperClipDisplayWidget } from '../epaper/EpaperClipDisplayWidget';
import { EpaperFeaturedWidget } from '../epaper/EpaperFeaturedWidget';
import { FeaturedEditionsWidget } from '../epaper/FeaturedEditionsWidget';
import { EpaperPageDisplayWidget } from '../epaper/EpaperPageDisplayWidget';
import { EpaperZoomWidget } from '../epaper/EpaperZoomWidget';
import { EpaperSocialSharingWidget } from '../epaper/EpaperSocialSharingWidget';
import { EpaperAreaMapDisplayWidget } from '../epaper/EpaperAreaMapDisplayWidget';
import { SocialWidget } from '../SocialWidget';
import { PageDownloadWidget } from '../page/PageDownloadWidget';
import { NavigationWidget } from '../navigation/NavigationWidget';
import { MenuWidget } from '../MenuWidget';

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
  
  // Check device visibility
  if (!isWidgetVisible(widget)) {
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
  // List of widgets that require EpaperContext
  const epaperContextWidgets = [
    'epaper-display',
    'epaper-page-display',
    'epaper-clip-share',
    'epaper-clip-display',
    'epaper-thumb-navigation',
    'epaper-zoom',
    'epaper-pagination',
    'epaper-pdf-download',
    'epaper-area-map',
    'epaper-area-map-display'
  ];

  // Check if widget needs EpaperContext
  const needsEpaperContext = epaperContextWidgets.includes(widget.type);

  if (needsEpaperContext) {
    // Try to use EpaperContext safely
    const epaperContext = useEpaperSafe();
    
    // If context is missing or incomplete, show preview placeholder
    if (!epaperContext || !epaperContext.editionId) {
      return (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
          <div className="text-blue-600 text-xs font-medium">
            📰 {widget.config?.title || widget.type.replace('epaper-', '').replace('-', ' ')} Preview
          </div>
          <div className="text-blue-500 text-xs mt-1">
            Widget preview in designer mode
          </div>
        </div>
      );
    }
  }

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
          style={imgStyle}
        />
      );
      
      // If there's a link, wrap in anchor tag
      if (widget.config.link) {
        return (
          <a 
            href={widget.config.link} 
            target={widget.config.target || '_self'}
            className={widget.config.cssClasses || ''}
          >
            {imgElement}
          </a>
        );
      }
      
      return imgElement;

    case 'text':
    case 'html':
      return (
        <div 
          className={widget.config.cssClasses || ''}
          style={parseInlineStyle(widget.config.style)}
          dangerouslySetInnerHTML={{ __html: widget.config.content || widget.config.html }} 
        />
      );

    case 'heading':
      const HeadingTag = (widget.config.renderTag || 'h1') as keyof JSX.IntrinsicElements;
      const headingText = widget.config.title || widget.config.text || 'Heading';
      const formatClass = widget.config.format || 'h4';
      
      return (
        <HeadingTag 
          className={`${formatClass} ${widget.config.cssClasses || ''}`}
          style={parseInlineStyle(widget.config.style)}
        >
          {headingText}
        </HeadingTag>
      );

    case 'button':
      return (
        <a
          href={widget.config.link || '#'}
          className={`inline-block px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm md:text-base font-medium text-center rounded transition-colors ${
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

    case 'epaper-archive':
      return <EpaperArchiveWidget config={widget.config} />;

    case 'epaper-calendar':
      return <EpaperCalendarWidget config={widget.config} />;

    case 'epaper-pagination':
      return <EpaperPaginationWidget config={widget.config} />;

    case 'epaper-pdf-download':
      return <EpaperPdfDownloadWidget config={widget.config} />;

    case 'page-download':
      return <PageDownloadWidget config={widget.config} />;

    case 'epaper-thumb-navigation':
      return <EpaperThumbNavigationWidget config={widget.config} />;

    case 'epaper-clip-share':
      return <EpaperClipShareWidget config={widget.config} />;

    case 'epaper-clip-display':
      return <EpaperClipDisplayWidget config={widget.config} />;

    case 'epaper-display':
    case 'epaper-page-display':
      return <EpaperPageDisplayWidget config={widget.config} />;

    case 'epaper-zoom':
      return <EpaperZoomWidget config={widget.config} />;

    case 'social-sharing':
      return <EpaperSocialSharingWidget config={widget.config} />;

    case 'epaper-featured':
      return <EpaperFeaturedWidget config={widget.config} />;

    case 'epaper-category':
      return <EpaperFeaturedWidget config={widget.config} />;

    case 'featured-editions':
      return <FeaturedEditionsWidget config={widget.config} />;

    case 'epaper-area-map':
    case 'epaper-area-map-display':
      return <EpaperAreaMapDisplayWidget config={widget.config} areaMapId={areaMapId} editionId={editionId} pageNumber={pageNumber} />

    case 'menu':
      return <MenuWidget config={widget.config} />;

    case 'navigation':
      return <NavigationWidget config={widget.config} />;

    default:
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-sm">Unknown widget type: {widget.type}</p>
        </div>
      );
  }
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