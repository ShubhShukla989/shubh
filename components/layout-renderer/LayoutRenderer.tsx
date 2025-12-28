'use client';

import { useEffect, useState } from 'react';
import { useColumnVisibility } from './ColumnVisibilityHelper';

import { ContextAwareWidget } from './ContextAwareWidget';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

interface LayoutRendererProps {
  layoutName: string;
  pageName?: string;
  areaMapId?: string;
  editionId?: string;
  pageNumber?: string;
}

export function LayoutRenderer({ layoutName, pageName, areaMapId, editionId, pageNumber }: LayoutRendererProps) {
  const { isColumnVisible, isRowVisible, isWidgetVisible } = useColumnVisibility();
  const [layoutData, setLayoutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Check if this is an epaper display page
  const isEpaperDisplayPage = layoutName === 'Epaper Display';
  
  // Check if this is an archive page
  const isArchivePage = layoutName === 'Epaper Archive' || (typeof window !== 'undefined' && window.location.pathname.includes('/epaper/category/'));

  // Mobile archive page widget filter
  const getMobileArchiveWidgets = (widgets: any[]) => {
    if (!isMobile || !isArchivePage) return widgets;
    
    const allowedTypes = ['heading', 'epaper-archive', 'epaper-calendar'];
    const filteredWidgets = widgets.filter(widget => allowedTypes.includes(widget.type));
    
    // Sort widgets in specific order: heading -> archive -> calendar
    return filteredWidgets.sort((a, b) => {
      const order = { 'heading': 0, 'epaper-archive': 1, 'epaper-calendar': 2 };
      return (order[a.type as keyof typeof order] || 999) - (order[b.type as keyof typeof order] || 999);
    });
  };

  const fetchLayout = async () => {
    try {
      setLoading(true);
      const url = pageName 
        ? `/api/layouts/${encodeURIComponent(layoutName)}/pages?pageName=${encodeURIComponent(pageName)}`
        : `/api/layouts/${encodeURIComponent(layoutName)}`;
      
      // Add cache busting and no-cache headers with timestamp
      const timestamp = Date.now();
      const response = await fetch(`${url}?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setLayoutData(data.data);
      } else {
        // Auto-fallback to Website Homepage if current layout fails
        if (layoutName !== 'Website Homepage') {
          const fallbackUrl = `/api/layouts/${encodeURIComponent('Website Homepage')}`;
          const fallbackResponse = await fetch(`${fallbackUrl}?_t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          });
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.data) {
            setLayoutData(fallbackData.data);
          } else {
            setLayoutData(null);
          }
        } else {
          setLayoutData(null);
        }
      }
    } catch (error) {
      setLayoutData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (layoutName) {
      fetchLayout();
    }
  }, [layoutName, pageName]);

  // Mobile Epaper Display Override - Use Layout Data (AFTER all hooks)
  if (isMobile && isEpaperDisplayPage && layoutData) {
    // Get epaper-display widget config from layout data
    let epaperDisplayWidget = null;
    let customWidth = '505px';
    let customHeight = '725px';
    
    // Find epaper-display widget in layout structure
    if (layoutData.structure) {
      const structure = typeof layoutData.structure === 'string' 
        ? JSON.parse(layoutData.structure) 
        : layoutData.structure;
      
      structure.rows?.forEach((row: any) => {
        row.columns?.forEach((column: any) => {
          column.widgets?.forEach((widget: any) => {
            if (widget.type === 'epaper-display' || widget.type === 'epaper-page-display') {
              epaperDisplayWidget = widget;
              // Get custom dimensions from widget config
              if (widget.config?.width) {
                customWidth = typeof widget.config.width === 'string' 
                  ? widget.config.width 
                  : `${widget.config.width}px`;
              }
              if (widget.config?.height) {
                customHeight = typeof widget.config.height === 'string' 
                  ? widget.config.height 
                  : `${widget.config.height}px`;
              }
            }
          });
        });
      });
    }
    
    return (
      <div className="mobile-epaper-display-layout">
        <style jsx>{`
          .mobile-epaper-display-layout {
            width: 100%;
            padding: 0.5rem;
            background: #f9fafb;
          }
          .mobile-heading-row {
            margin-bottom: 1rem;
            padding: 1rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .mobile-controls-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .mobile-control-widget {
            flex: 1;
            min-width: 0;
            display: flex;
            justify-content: center;
          }
          .mobile-control-widget button {
            width: 100%;
            min-height: 40px;
            font-size: 12px;
            padding: 8px 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            pointer-events: auto;
            z-index: 10;
          }
          .mobile-control-widget .inline-flex {
            pointer-events: auto;
            z-index: 10;
          }
          .mobile-control-widget .inline-flex button {
            pointer-events: auto;
            z-index: 10;
            width: auto;
          }
          .mobile-epaper-row {
            display: flex;
            justify-content: center;
            padding: 1rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .mobile-epaper-container {
            width: 100%;
            max-width: ${customWidth};
            height: ${customHeight};
            max-height: calc(100vh - 250px);
            overflow: hidden;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          @media (max-width: 480px) {
            .mobile-epaper-container {
              max-width: min(${customWidth}, 465px);
              height: min(${customHeight}, 695px);
              max-height: calc(100vh - 220px);
            }
          }
          @media (max-width: 360px) {
            .mobile-epaper-container {
              max-width: min(${customWidth}, 425px);
              height: min(${customHeight}, 655px);
              max-height: calc(100vh - 200px);
            }
          }
        `}</style>

        {/* Row 1: Control Buttons */}
        <div className="mobile-controls-row">
          <div className="mobile-control-widget">
            <ContextAwareWidget 
              widget={{
                id: 'mobile-pagination',
                type: 'epaper-pagination',
                config: { 
                  title: '', 
                  pagerFormat: 'pagination-control-mini',
                  cssClasses: 'text-xs' 
                }
              }}
              areaMapId={areaMapId}
              editionId={editionId}
              pageNumber={pageNumber}
            />
          </div>
          <div className="mobile-control-widget">
            <ContextAwareWidget 
              widget={{
                id: 'mobile-pdf-download',
                type: 'epaper-pdf-download',
                config: { 
                  title: '', 
                  buttonText: 'PDF',
                  target: 'new-window',
                  cssClasses: 'text-xs' 
                }
              }}
              areaMapId={areaMapId}
              editionId={editionId}
              pageNumber={pageNumber}
            />
          </div>
          <div className="mobile-control-widget">
            <ContextAwareWidget 
              widget={{
                id: 'mobile-calendar',
                type: 'epaper-calendar',
                config: { 
                  title: '', 
                  format: 'button-calendar-with-category',
                  buttonLabel: 'Archive',
                  cssClasses: 'text-xs' 
                }
              }}
              areaMapId={areaMapId}
              editionId={editionId}
              pageNumber={pageNumber}
            />
          </div>
          <div className="mobile-control-widget">
            <ContextAwareWidget 
              widget={{
                id: 'mobile-clip-share',
                type: 'epaper-clip-share',
                config: { 
                  title: '', 
                  buttonText: 'Clip',
                  cssClasses: 'text-xs' 
                }
              }}
              areaMapId={areaMapId}
              editionId={editionId}
              pageNumber={pageNumber}
            />
          </div>
        </div>

        {/* Row 2: Mobile Heading Widget */}
        <div className="mobile-heading-row">
          <ContextAwareWidget 
            widget={{
              id: 'mobile-heading-widget',
              type: 'heading',
              config: { 
                title: '',
                text: 'Edition Title',
                level: 'h2',
                cssClasses: 'mobile-heading'
              }
            }}
            areaMapId={areaMapId}
            editionId={editionId}
            pageNumber={pageNumber}
          />
        </div>

        {/* Row 3: Epaper Display - Custom Size from Designer */}
        <div className="mobile-epaper-row">
          <div className="mobile-epaper-container">
            <ContextAwareWidget 
              widget={epaperDisplayWidget || {
                id: 'mobile-epaper-display',
                type: 'epaper-display',
                config: { 
                  title: '',
                  width: customWidth,
                  height: customHeight,
                  cssClasses: ''
                }
              }}
              areaMapId={areaMapId}
              editionId={editionId}
              pageNumber={pageNumber}
            />
          </div>
        </div>
      </div>
    );
  }

  // Device detection removed - using responsive CSS instead

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-500">Loading layout...</div>
      </div>
    );
  }

  if (!layoutData) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-500">Layout not found: {layoutName}</div>
      </div>
    );
  }

  // Parse structure safely
  let structure;
  try {
    structure = typeof layoutData.structure === 'string' 
      ? JSON.parse(layoutData.structure) 
      : layoutData.structure;
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-500">Invalid layout structure</div>
      </div>
    );
  }

  if (!structure || !structure.rows || structure.rows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-yellow-600">Layout has no content</div>
      </div>
    );
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
      <div className="layout-renderer responsive-layout" data-layout={layoutName}>
        <style jsx>{`
          .layout-renderer .layout-row {
            width: 100%;
            display: block;
          }
          .layout-renderer .layout-row > div {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            align-items: stretch;
          }
          .layout-renderer .layout-column {
            display: flex;
            flex-direction: column;
            min-height: 1px;
            box-sizing: border-box;
          }
          .layout-renderer .widget {
            display: block;
          }
          
          /* Mobile adjustments */
          @media (max-width: 768px) {
            .layout-renderer .layout-column {
              padding: 0.125rem;
            }
            
            /* Mobile archive page: Force vertical layout */
            .layout-renderer .mobile-archive-column {
              width: 100% !important;
              max-width: 100% !important;
              flex: 0 0 100% !important;
            }
            
            /* Mobile archive: Stack widgets vertically */
            .layout-renderer .mobile-archive-column .widget {
              margin-bottom: 1rem;
            }
          }
        `}</style>
        {structure.rows?.filter((row: any) => isRowVisible(row)).map((row: any) => {
          // Render ALL columns to preserve grid structure
          const allColumns = row.columns || [];
          
          if (allColumns.length === 0) return null;
          
          return (
            <div 
              key={row.id} 
              className={`layout-row ${row.properties?.cssClass || row.cssClass || ''}`}
              style={parseInlineStyle(row.properties?.customCss || row.properties?.customStyle || row.customStyle)}
            >
              <div className="flex flex-wrap w-full">
                {allColumns.map((column: any, index: number) => {
                  // Filter visible widgets for this column
                  let visibleWidgets = column.widgets?.filter((widget: any) => isWidgetVisible(widget)) || [];
                  
                  // Apply mobile archive filtering
                  visibleWidgets = getMobileArchiveWidgets(visibleWidgets);
                  
                  // Get column width from designer settings
                  const getColumnWidth = () => {
                    const cssClass = column.properties?.cssClass || column.cssClass || '';
                    
                    // Bootstrap column classes (col-1 to col-12)
                    const colMatch = cssClass.match(/col-(\d+)/);
                    if (colMatch) {
                      const colSize = parseInt(colMatch[1]);
                      return (colSize / 12) * 100;
                    }
                    
                    // Default: equal distribution
                    return 100 / allColumns.length;
                  };
                  
                  const columnWidth = getColumnWidth();
                  
                  return (
                    <div
                      key={column.id}
                      className={`layout-column ${column.properties?.cssClass || column.cssClass || ''} ${
                        isMobile && isArchivePage ? 'mobile-archive-column' : ''
                      }`}
                      style={{
                        flex: isMobile && isArchivePage ? '0 0 100%' : `0 0 ${columnWidth}%`,
                        maxWidth: isMobile && isArchivePage ? '100%' : 'none', // Allow widgets to exceed column width
                        width: isMobile && isArchivePage ? '100%' : 'auto', // Let widgets control their own width
                        boxSizing: 'border-box',
                        padding: '0.25rem',
                        overflow: 'visible', // Allow content to overflow if needed
                        ...parseInlineStyle(column.properties?.customCss || column.properties?.customStyle || column.customStyle),
                      }}
                    >
                      {visibleWidgets.map((widget: any) => (
                        <div key={widget.id} className="widget">
                          <WidgetErrorBoundary widgetType={widget.type}>
                            <ContextAwareWidget 
                              widget={widget} 
                              areaMapId={areaMapId} 
                              editionId={editionId} 
                              pageNumber={pageNumber}
                            />
                          </WidgetErrorBoundary>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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