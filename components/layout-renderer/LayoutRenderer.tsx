'use client';

import { useEffect, useState } from 'react';
import { EpaperArchiveWidget } from '../epaper/EpaperArchiveWidget';
import { EpaperCalendarWidget } from '../epaper/EpaperCalendarWidget';
import { EpaperPaginationWidget } from '../epaper/EpaperPaginationWidget';
import { EpaperPdfDownloadWidget } from '../epaper/EpaperPdfDownloadWidget';
import { EpaperThumbNavigationWidget } from '../epaper/EpaperThumbNavigationWidget';
import { EpaperDisplayWidget } from '../epaper/EpaperDisplayWidget';
import { EpaperClipShareWidget } from '../epaper/EpaperClipShareWidget';
import { EpaperFeaturedWidget } from '../epaper/EpaperFeaturedWidget';

interface LayoutRendererProps {
  layoutName: string;
  pageName?: string;
}

export function LayoutRenderer({ layoutName, pageName }: LayoutRendererProps) {
  const [layoutData, setLayoutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLayout();
  }, [layoutName, pageName]);

  const fetchLayout = async () => {
    try {
      setLoading(true);
      const url = pageName 
        ? `/api/layouts/${encodeURIComponent(layoutName)}/pages?pageName=${encodeURIComponent(pageName)}`
        : `/api/layouts/${encodeURIComponent(layoutName)}`;
      
      // Add cache busting and no-cache headers
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setLayoutData(data.data);
      }
    } catch (error) {
      console.error('Error fetching layout:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Silent loading
  }

  if (!layoutData) {
    return null; // Silent fail
  }

  return (
    <>
      {/* Custom CSS */}
      {layoutData.custom_css && (
        <style 
          dangerouslySetInnerHTML={{ __html: layoutData.custom_css }}
          data-layout={layoutName}
        />
      )}

      {/* Render Layout Structure */}
      <div className="layout-renderer" data-layout={layoutName}>
        {layoutData.structure?.rows?.map((row: any) => (
          <div 
            key={row.id} 
            className={`layout-row ${row.properties?.cssClass || row.cssClass || ''}`}
            style={parseInlineStyle(row.properties?.customCss || row.properties?.customStyle || row.customStyle)}
          >
            <div className="flex flex-wrap">
              {row.columns?.map((column: any) => (
                <div
                  key={column.id}
                  className={`layout-column ${column.properties?.cssClass || column.cssClass || ''}`}
                  style={{
                    flex: `0 0 ${((column.width || 6) / 12) * 100}%`,
                    maxWidth: `${((column.width || 6) / 12) * 100}%`,
                    boxSizing: 'border-box',
                    ...parseInlineStyle(column.properties?.customCss || column.properties?.customStyle || column.customStyle),
                  }}
                >
                  {/* Render Widgets */}
                  {column.widgets?.map((widget: any) => (
                    <div key={widget.id} className={`widget ${widget.config?.cssClasses || ''}`}>
                      {renderWidget(widget)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom JS */}
      {layoutData.custom_js && (
        <script 
          dangerouslySetInnerHTML={{ __html: layoutData.custom_js }}
          type="text/javascript"
        />
      )}
    </>
  );
}

function renderWidget(widget: any) {
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
      const headingText = widget.config.title || 'Heading';
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
          className={`btn btn-${widget.config.style || 'primary'}`}
        >
          {widget.config.text}
        </a>
      );

    case 'epaper-archive':
      return <EpaperArchiveWidget config={widget.config} />;

    case 'epaper-calendar':
      return <EpaperCalendarWidget config={widget.config} />;

    case 'epaper-pagination':
      return <EpaperPaginationWidget config={widget.config} />;

    case 'epaper-pdf-download':
      return <EpaperPdfDownloadWidget config={widget.config} />;

    case 'epaper-thumb-navigation':
      return <EpaperThumbNavigationWidget config={widget.config} />;

    case 'epaper-clip-share':
      return <EpaperClipShareWidget config={widget.config} />;

    case 'epaper-display':
      return <EpaperDisplayWidget config={widget.config} />;

    case 'epaper-featured':
      return <EpaperFeaturedWidget config={widget.config} />;

    default:
      return null;
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
