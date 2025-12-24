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
      
      if (data.success && data.data) {
        console.log('Layout data fetched:', data.data);
        setLayoutData(data.data);
      } else {
        console.error('Failed to fetch layout:', data);
        
        // Auto-fallback to Website Homepage if current layout fails
        if (layoutName !== 'Website Homepage') {
          console.log('🔧 Attempting fallback to Website Homepage');
          const fallbackUrl = `/api/layouts/${encodeURIComponent('Website Homepage')}`;
          const fallbackResponse = await fetch(fallbackUrl, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          });
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.data) {
            console.log('✅ Fallback layout loaded');
            setLayoutData(fallbackData.data);
          } else {
            setLayoutData(null);
          }
        } else {
          setLayoutData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching layout:', error);
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
    console.error('Failed to parse layout structure:', error);
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
            padding: 0.25rem;
          }
          
          /* All screens: Keep columns in row (horizontal layout) */
          .layout-renderer .layout-row > div {
            flex-direction: row !important;
            align-items: stretch !important;
          }
          
          /* Mobile adjustments: Smaller padding, responsive text */
          @media (max-width: 767px) {
            .layout-renderer .layout-column {
              padding: 0.125rem;
            }
            
            /* Make widgets more compact on mobile */
            .layout-renderer .widget {
              font-size: 0.875rem;
            }
            
            /* Smaller buttons on mobile */
            .layout-renderer .widget button {
              padding: 0.375rem 0.75rem;
              font-size: 0.75rem;
            }
          }
          
          /* Ensure widgets fill their containers */
          .layout-renderer .widget {
            width: 100%;
            display: block;
          }
        `}</style>
        {console.log('🎯 Rendering structure:', structure)}
        {structure.rows?.filter((row: any) => isRowVisible(row)).map((row: any) => {
          // Filter visible columns for this device
          const visibleColumns = row.columns?.filter((column: any) => {
            if (!isColumnVisible(column)) return false;
            
            // Check if column has any visible widgets
            const hasVisibleWidgets = column.widgets?.some((widget: any) => isWidgetVisible(widget));
            return hasVisibleWidgets;
          }) || [];
          
          // If no visible columns, don't render the row
          if (visibleColumns.length === 0) return null;
          
          return (
            <div 
              key={row.id} 
              className={`layout-row ${row.properties?.cssClass || row.cssClass || ''}`}
              style={parseInlineStyle(row.properties?.customCss || row.properties?.customStyle || row.customStyle)}
            >
              <div className="flex flex-wrap w-full">
                {visibleColumns.map((column: any, index: number) => {
                  // Filter visible widgets for this column
                  const visibleWidgets = column.widgets?.filter((widget: any) => isWidgetVisible(widget)) || [];
                  
                  // Auto-adjust width: divide 100% equally among visible columns with widgets
                  const autoWidth = 100 / visibleColumns.length;
                  
                  return (
                    <div
                      key={column.id}
                      className={`layout-column ${column.properties?.cssClass || column.cssClass || ''}`}
                      style={{
                        flex: `0 0 ${autoWidth}%`,
                        maxWidth: `${autoWidth}%`,
                        width: `${autoWidth}%`,
                        boxSizing: 'border-box',
                        ...parseInlineStyle(column.properties?.customCss || column.properties?.customStyle || column.customStyle),
                      }}
                    >
                      {/* Render Only Visible Widgets */}
                      {visibleWidgets.map((widget: any) => (
                        <div key={widget.id} className={`widget responsive-widget ${widget.config?.cssClasses || ''}`}>
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