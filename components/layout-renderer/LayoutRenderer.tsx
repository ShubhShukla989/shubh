'use client';

import { useEffect, useState } from 'react';
import { useColumnVisibility } from './ColumnVisibilityHelper';
import { ContextAwareWidget } from './ContextAwareWidget';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { parseInlineStyle } from '@/lib/utils/styleParser';

interface LayoutRendererProps {
  layoutName: string;
  pageName?: string;
  areaMapId?: string;
  editionId?: string;
  pageNumber?: string;
}

interface LayoutData {
  structure: any;
  custom_css?: string;
  custom_js?: string;
}

export function LayoutRenderer({ layoutName, pageName, areaMapId, editionId, pageNumber }: LayoutRendererProps) {
  const { isColumnVisible, isRowVisible, isWidgetVisible } = useColumnVisibility();
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use the existing useColumnVisibility hook instead of duplicate mobile detection
  const { isMobile } = useColumnVisibility();

  // Check if this is an epaper display page
  const isEpaperDisplayPage = layoutName === 'Epaper Display';
  
  // Check if this is PC view (desktop) for epaper display
  const isPCEpaperDisplay = !isMobile && isEpaperDisplayPage;
  
  // Cache key for layout data
  const cacheKey = `layout_${layoutName}_${pageName || 'default'}`;
  
  // Listen for layout saves from the designer (cross-tab + same-tab)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'layout_updated') {
        sessionStorage.removeItem(cacheKey);
        fetchLayout();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [cacheKey]);

  // No sessionStorage cache — always fetch fresh from server
  useEffect(() => {
    if (layoutName) {
      fetchLayout();
    }
  }, [layoutName, pageName]);
  
  // Check if this is an archive page
  const isArchivePage = layoutName === 'Epaper Archive' || (typeof window !== 'undefined' && window.location.pathname.includes('/epaper/category/'));

  // Mobile archive page widget filter - ONLY apply to Epaper Archive layout, NOT Site Header
  const getMobileArchiveWidgets = (widgets: any[]) => {
    // CRITICAL FIX: Don't filter Site Header widgets - only filter Epaper Archive layout
    if (!isMobile || !isArchivePage || layoutName === 'Site Header' || layoutName === 'Site Footer') {
      return widgets;
    }
    
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
      
      // Always fetch fresh — no cache busting needed
      const response = await fetch(url, {
        cache: 'no-store',
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setLayoutData(data.data);
      } else {
        // Auto-fallback to Website Homepage if current layout fails (prevent infinite loop)
        if (layoutName !== 'Website Homepage') {
          const fallbackUrl = `/api/layouts/${encodeURIComponent('Website Homepage')}`;
          const fallbackResponse = await fetch(fallbackUrl, {
            cache: 'no-store',
          });
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.data) {
            setLayoutData(fallbackData.data);
          } else {
            // If even fallback fails, create minimal structure
            setLayoutData({
              structure: { rows: [] },
              custom_css: '',
              custom_js: ''
            });
          }
        } else {
          // If Website Homepage itself fails, create minimal structure
          setLayoutData({
            structure: { rows: [] },
            custom_css: '',
            custom_js: ''
          });
        }
      }
    } catch (error) {
      // Layout fetch error - provide fallback structure to prevent crashes
      setLayoutData({
        structure: { rows: [] },
        custom_css: '',
        custom_js: ''
      });
    } finally {
      setLoading(false);
    }
  };

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
        <style dangerouslySetInnerHTML={{
          __html: `
          .mobile-epaper-display-layout {
            width: 100%;
            padding: 0; /* Removed automatic padding - edge to edge */
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
            padding: 0; /* Removed automatic padding - edge to edge */
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .mobile-control-widget {
            flex: 1;
            min-width: 50px;
            max-width: 80px;
            display: flex;
            justify-content: center;
          }
          .mobile-control-widget button {
            width: 100%;
            min-height: 36px;
            font-size: 10px;
            padding: 6px 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2px;
            pointer-events: auto;
            z-index: 10;
            white-space: nowrap;
            border-radius: 4px;
          }
          .mobile-control-widget .inline-flex {
            pointer-events: auto;
            z-index: 10;
            width: 100%;
            min-height: 36px;
          }
          .mobile-control-widget .inline-flex button {
            pointer-events: auto;
            z-index: 10;
            width: 100%;
            min-height: 36px;
            padding: 6px 4px;
            font-size: 10px;
          }
          .mobile-epaper-row {
            display: flex;
            justify-content: center;
            padding: 0.25rem;
            background: transparent;
          }
          .mobile-epaper-container {
            width: calc(100vw - 1rem);
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: white;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            text-align: center;
            padding: 0.25rem;
          }
          .mobile-epaper-container > * {
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            display: block !important;
            margin: 0 auto !important;
          }
          `
        }} />

        {/* Row 1: Mobile Heading Widget */}
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

        {/* Row 2: Epaper Display - Custom Size from Designer */}
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
    // Show minimal loading for all layouts
    return null; // No loading text - content appears directly
  }

  if (!layoutData) {
    // Don't return null - render a minimal fallback to ensure header/footer still work
    return (
      <div className="layout-renderer-fallback" data-layout={layoutName}>
        <div className="text-center py-8 text-gray-500">
          Layout "{layoutName}" not found
        </div>
      </div>
    );
  }

  // Parse structure safely with better error handling
  let structure;
  try {
    if (!layoutData.structure) {
      // Don't return null - render a minimal fallback
      return (
        <div className="layout-renderer-fallback" data-layout={layoutName}>
          <div className="text-center py-8 text-gray-500">
            Layout "{layoutName}" has no structure
          </div>
        </div>
      );
    }
    
    structure = typeof layoutData.structure === 'string' 
      ? JSON.parse(layoutData.structure) 
      : layoutData.structure;
      
    // Validate structure format
    if (!structure || typeof structure !== 'object') {
      throw new Error('Invalid structure format');
    }
    
  } catch (error) {
    // Don't return null - render a minimal fallback
    return (
      <div className="layout-renderer-fallback" data-layout={layoutName}>
        <div className="text-center py-8 text-gray-500">
          Layout "{layoutName}" has invalid structure
        </div>
      </div>
    );
  }

  if (!structure || !structure.rows || structure.rows.length === 0) {
    // Don't return null - render a minimal fallback
    return (
      <div className="layout-renderer-fallback" data-layout={layoutName}>
        <div className="text-center py-8 text-gray-500">
          Layout "{layoutName}" is empty
        </div>
      </div>
    );
  }

  // Check if all rows are empty (no widgets)
  const hasAnyWidgets = structure.rows.some((row: any) => 
    row.columns && row.columns.some((col: any) => 
      col.widgets && col.widgets.length > 0
    )
  );

  if (!hasAnyWidgets) {
    // Don't return null - render a minimal fallback
    return (
      <div className="layout-renderer-fallback" data-layout={layoutName}>
        <div className="text-center py-8 text-gray-500">
          Layout "{layoutName}" has no widgets
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS - with basic sanitization */}
      {layoutData.custom_css && (
        <style 
          dangerouslySetInnerHTML={{ 
            __html: layoutData.custom_css.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') 
          }}
          data-layout={layoutName}
        />
      )}

      {/* PC Epaper Display: Centered 70% Width Container */}
      {isPCEpaperDisplay ? (
        <div className="pc-epaper-centered-container">
          <style dangerouslySetInnerHTML={{
            __html: `
            .pc-epaper-centered-container {
              width: 70%;
              margin: 0 auto;
              max-width: 100%;
              box-sizing: border-box;
              padding: 0; /* NO PADDING - NO OUTER CARD EFFECT */
              min-height: 100vh;
            }
            
            .pc-epaper-centered-container .layout-renderer {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
            }
            
            .pc-epaper-centered-container .layout-row {
              width: 100%;
              display: block;
              margin-bottom: 0; /* Removed automatic margin - user can add if needed */
              background: transparent;
              border-radius: 0;
              padding: 0;
            }
            
            .pc-epaper-centered-container .layout-row.has-widgets {
              background: white !important;
              /* Removed automatic border - user can add if needed */
              /* Removed border-radius - user can add if needed */
              /* Removed box-shadow - user can add if needed */
            }
            
            .pc-epaper-centered-container .layout-row:last-child {
              margin-bottom: 0;
            }
            
            .pc-epaper-centered-container .layout-row > div {
              display: flex;
              flex-wrap: nowrap; /* Force widgets to stay in same row */
              align-items: flex-start;
              justify-content: inherit; /* Allow custom alignment */
              width: 100%;
              gap: 0;
              padding: 0; /* Removed automatic padding - edge to edge */
            }
            
            .pc-epaper-centered-container .layout-column {
              display: flex;
              flex-direction: row;
              flex-wrap: wrap; /* Allow wrapping for large widgets like epaper display */
              align-items: flex-start;
              justify-content: inherit; /* Allow custom alignment */
              box-sizing: border-box;
              padding: 0;
              margin: 0;
              gap: 0;
              /* Ensure column takes exact grid width and aligns left */
              align-self: flex-start;
            }
            
            /* Special handling for small control widgets */
            .pc-epaper-centered-container .layout-column.control-widgets {
              flex-wrap: nowrap; /* Force small widgets to stay in same row */
            }
            
            /* Special handling for epaper display widgets */
            .pc-epaper-centered-container .layout-column .widget [class*="epaper-page-display"],
            .pc-epaper-centered-container .layout-column .widget [class*="epaper-display"] {
              width: 100% !important;
              max-width: 100% !important;
              overflow: hidden;
            }
            
            /* Ensure epaper widget containers don't exceed column width */
            .pc-epaper-centered-container .widget .epaper-page-display-widget,
            .pc-epaper-centered-container .widget .epaper-display-widget {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow: hidden;
              box-sizing: border-box;
            }
            
            /* Override any fixed widths in epaper widgets */
            .pc-epaper-centered-container .widget .epaper-page-display-widget > *,
            .pc-epaper-centered-container .widget .epaper-display-widget > * {
              max-width: 100% !important;
              box-sizing: border-box;
            }
            
            .pc-epaper-centered-container .widget {
              flex: 0 0 auto; /* Don't grow/shrink, use natural width */
              max-width: 100%;
              box-sizing: border-box;
              margin: 0 !important;
              padding: 0 !important;
              /* Flexible alignment within grid area */
              text-align: inherit;
              align-self: flex-start;
              justify-self: flex-start;
              /* Prevent any centering or floating */
              float: none;
              position: static;
            }
            
            /* Allow user-defined spacing and alignment */
            .pc-epaper-centered-container .widget[style*="margin"] {
              margin: revert !important;
            }
            
            .pc-epaper-centered-container .widget[style*="padding"] {
              padding: revert !important;
            }
            
            .pc-epaper-centered-container .widget[style*="text-align: center"] {
              text-align: center !important;
            }
            
            .pc-epaper-centered-container .widget[style*="text-align: right"] {
              text-align: right !important;
            }
            
            /* Override widget centering and ensure strict left alignment */
            .pc-epaper-centered-container .widget [class*="epaper"] {
              margin: 0 !important;
              text-align: inherit;
              /* Prevent any auto-centering */
              margin-left: 0 !important;
              margin-right: 0 !important;
              float: none;
              position: static;
            }
            
            /* Override framework centering classes */
            .pc-epaper-centered-container .widget .mx-auto,
            .pc-epaper-centered-container .widget .text-center,
            .pc-epaper-centered-container .widget .justify-center,
            .pc-epaper-centered-container .widget .items-center {
              margin-left: 0 !important;
              margin-right: 0 !important;
              text-align: inherit !important;
              justify-content: inherit !important;
              align-items: flex-start !important;
            }
            
            /* Ensure epaper widgets fit within container */
            .pc-epaper-centered-container .epaper-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
            }
            
            /* Responsive: Full width on mobile */
            @media (max-width: 768px) {
              .pc-epaper-centered-container {
                width: 100%;
                padding: 0; /* Removed automatic padding */
              }
            }
            `
          }} />
          
          {/* Render Layout Structure within centered container */}
          <div className="layout-renderer responsive-layout" data-layout={layoutName}>
            {renderLayoutContent(structure)}
          </div>
        </div>
      ) : (
        /* Regular Layout for Mobile and Non-Epaper Pages */
        <div className="layout-renderer responsive-layout" data-layout={layoutName}>
          <style dangerouslySetInnerHTML={{
            __html: `
            .layout-renderer {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0; /* REMOVED ALL PADDING - EDGE TO EDGE */
              box-sizing: border-box;
            }
            .layout-renderer .layout-row {
              width: 100%;
              display: block;
            }
            
            /* Mobile adjustments */
            @media (max-width: 768px) {
              .layout-renderer {
                padding: 0; /* ZERO PADDING ON MOBILE TOO */
              }
            }
            `
          }} />
          
          {renderLayoutContent(structure)}
        </div>
      )}

      {/* Custom JS - with basic sanitization */}
      {layoutData.custom_js && (
        <script 
          dangerouslySetInnerHTML={{ 
            __html: layoutData.custom_js.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') 
          }}
        />
      )}
    </>
  );

  // Helper function to render layout content
  function renderLayoutContent(structure: any) {
    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
          .layout-renderer .layout-row {
            width: 100%;
            display: block;
            margin-bottom: 1rem; /* SPACING BETWEEN ROWS */
            background: transparent;
            border-radius: 0;
            padding: 0;
          }
          
          /* PLAIN WHITE ROWS - NO BORDER, NO SHADOW, NO ROUNDED CORNERS */
          .layout-renderer .layout-row.has-widgets {
            background: white !important;
            border: none;
            border-radius: 0;
            box-shadow: none;
            margin-bottom: 1rem;
            padding: 1rem;
          }

          /* Navigation row - full width, no padding */
          .layout-renderer .layout-row.has-navigation {
            background: transparent !important;
            border: none;
            border-radius: 0;
            box-shadow: none;
            margin-bottom: 0;
            padding: 0 !important;
          }
          
          /* Navigation row inner flex container - no padding/gap */
          .layout-renderer .layout-row.has-navigation > div {
            padding: 0 !important;
            gap: 0 !important;
          }
          
          /* Navigation column - full width, no padding */
          .layout-renderer .layout-row.has-navigation .layout-column {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Navigation widget wrapper - full width, no padding */
          .layout-renderer .layout-row.has-navigation .widget {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .layout-renderer .layout-row:last-child {
            margin-bottom: 0;
          }
          
          .layout-renderer .layout-row > div {
            width: 100%;
            display: flex;
            flex-wrap: nowrap;
            align-items: flex-start;
            justify-content: flex-start; /* LEFT ALIGN BY DEFAULT */
            margin: 0;
            gap: 1rem; /* SPACING BETWEEN COLUMNS */
            padding: 0;
          }
          
          .layout-renderer .layout-column {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: inherit;
            box-sizing: border-box;
            padding: 0; /* ZERO PADDING */
            margin: 0; /* ZERO MARGIN */
            gap: 0; /* NO GAPS */
            align-self: flex-start;
          }
          
          /* Special handling for small control widgets - keep them in same row */
          .layout-renderer .layout-column.control-widgets {
            flex-wrap: nowrap; /* Force small widgets to stay in same row */
          }
          
          /* Special handling for epaper display widgets - allow proper sizing */
          .layout-renderer .layout-column .widget [class*="epaper-page-display"],
          .layout-renderer .layout-column .widget [class*="epaper-display"] {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden;
          }
          
          /* Ensure epaper widget containers don't exceed column width */
          .layout-renderer .widget .epaper-page-display-widget,
          .layout-renderer .widget .epaper-display-widget {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            overflow: hidden;
            box-sizing: border-box;
          }
          
          /* Override any fixed widths in epaper widgets */
          .layout-renderer .widget .epaper-page-display-widget > *,
          .layout-renderer .widget .epaper-display-widget > * {
            max-width: 100% !important;
            box-sizing: border-box;
          }
          
          /* Complete widget spacing reset */
          .layout-renderer .widget {
            flex: 0 0 auto; /* Don't grow/shrink, use natural width */
            max-width: 100%;
            box-sizing: border-box;
            margin: 0 !important; /* Zero margin by default */
            padding: 0 !important; /* Zero padding by default */
            /* Flexible alignment within grid area */
            text-align: inherit;
            align-self: flex-start;
            justify-self: flex-start;
            /* Prevent any centering or floating */
            float: none;
            position: static;
          }
          
          /* Allow user-defined spacing to override */
          .layout-renderer .widget[style*="margin"] {
            margin: revert !important; /* User-defined margins take precedence */
          }
          
          .layout-renderer .widget[style*="padding"] {
            padding: revert !important; /* User-defined padding takes precedence */
          }
          
          /* Allow user-defined alignment to override */
          .layout-renderer .widget[style*="text-align: center"] {
            text-align: center !important;
          }
          
          .layout-renderer .widget[style*="text-align: right"] {
            text-align: right !important;
          }
          
          /* Override any centering CSS from widget components */
          .layout-renderer .widget [class*="epaper"],
          .layout-renderer .widget > * {
            margin: 0 !important;
            text-align: inherit;
            /* Prevent any auto-centering */
            margin-left: 0 !important;
            margin-right: 0 !important;
            float: none;
            position: static;
          }
          
          /* Override Tailwind and other framework centering classes */
          .layout-renderer .widget .mx-auto,
          .layout-renderer .widget .text-center,
          .layout-renderer .widget .justify-center,
          .layout-renderer .widget .items-center {
            margin-left: 0 !important;
            margin-right: 0 !important;
            text-align: inherit !important;
            justify-content: inherit !important;
            align-items: flex-start !important;
          }
          
          /* Allow user-defined centering classes */
          .layout-renderer .widget.center,
          .layout-renderer .widget.text-center {
            text-align: center !important;
          }
          
          .layout-renderer .widget.right,
          .layout-renderer .widget.text-right {
            text-align: right !important;
          }
          
          /* Mobile adjustments */
          @media (max-width: 768px) {
            .layout-renderer {
              padding: 0; /* ZERO PADDING ON MOBILE */
            }
            
            .layout-renderer .layout-row > div {
              flex-direction: column;
            }
            
            .layout-renderer .layout-column {
              width: 100% !important;
              min-width: 100% !important;
              padding: 0;
              margin: 0; /* REMOVED MOBILE MARGIN */
              flex-direction: column;
            }
            
            .layout-renderer .widget {
              width: 100% !important;
              margin: 0; /* REMOVED MOBILE MARGIN */
            }
          }
          `
        }} />
        
        {structure.rows?.filter((row: any) => isRowVisible(row)).map((row: any) => {
          // Render ALL columns to preserve grid structure
          const allColumns = row.columns || [];
          
          if (allColumns.length === 0) return null;
          
          // Check if this row has any visible widgets
          const hasVisibleWidgets = allColumns.some((column: any) => {
            let visibleWidgets = column.widgets?.filter((widget: any) => isWidgetVisible(widget)) || [];
            visibleWidgets = getMobileArchiveWidgets(visibleWidgets);
            return visibleWidgets.length > 0;
          });

          const hasNavigationWidget = allColumns.some((column: any) =>
            column.widgets?.some((widget: any) => widget.type === 'navigation')
          );
          
          return (
            <div 
              key={row.id} 
              className={`layout-row ${hasVisibleWidgets ? 'has-widgets' : ''} ${hasNavigationWidget ? 'has-navigation' : ''} ${row.properties?.cssClass || row.cssClass || ''}`}
              style={parseInlineStyle(row.properties?.customStyle || row.properties?.customCss || row.customStyle)}
            >
              <div className="flex flex-wrap w-full">
                {allColumns.map((column: any, index: number) => {
                  // Filter visible widgets for this column
                  let visibleWidgets = column.widgets?.filter((widget: any) => isWidgetVisible(widget)) || [];
                  
                  // Apply mobile archive filtering
                  visibleWidgets = getMobileArchiveWidgets(visibleWidgets);
                  
                  // Get column width from designer settings with better validation
                  const getColumnWidth = () => {
                    const cssClass = column.properties?.cssClass || column.cssClass || '';
                    
                    // Bootstrap column classes (col-1 to col-12)
                    const colMatch = cssClass.match(/col-(\d+)/);
                    if (colMatch) {
                      const colSize = parseInt(colMatch[1]);
                      if (colSize >= 1 && colSize <= 12) {
                        return (colSize / 12) * 100;
                      }
                    }
                    
                    // Responsive column classes (col-md-6, col-lg-4, etc.)
                    const responsiveMatch = cssClass.match(/col-(?:xs|sm|md|lg|xl)-(\d+)/);
                    if (responsiveMatch) {
                      const colSize = parseInt(responsiveMatch[1]);
                      if (colSize >= 1 && colSize <= 12) {
                        return (colSize / 12) * 100;
                      }
                    }
                    
                    // Default: equal distribution with minimum width
                    const equalWidth = 100 / Math.max(allColumns.length, 1);
                    return Math.max(equalWidth, 8.33); // Minimum 1/12 width
                  };
                  
                  const hasNavigationWidget = visibleWidgets.some((w: any) => w.type === 'navigation');
                  const columnWidth = hasNavigationWidget ? 100 : getColumnWidth();
                  
                  return (
                    <div
                      key={column.id}
                      className={`layout-column ${column.properties?.cssClass || column.cssClass || ''}`}
                      style={{
                        width: `${columnWidth}%`,
                        minWidth: '8.33%',
                        padding: '0', // ZERO PADDING FOR PC VIEW
                        boxSizing: 'border-box',
                        ...parseInlineStyle(column.properties?.customStyle || column.properties?.customCss || column.customStyle)
                      }}
                    >
                      {visibleWidgets.map((widget: any) => {
                        const isEpaperDisplay = widget.type === 'epaper-display' || widget.type === 'epaper-page-display';
                        
                        return (
                          <div 
                            key={widget.id} 
                            className={`widget ${widget.config?.cssClasses || ''}`}
                            style={{
                              ...(isEpaperDisplay ? {
                                maxWidth: '100%',
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                                textAlign: 'inherit'
                              } : {}),
                              ...parseInlineStyle(widget.config?.style)
                            }}
                          >
                            <WidgetErrorBoundary widgetType={widget.type}>
                              <ContextAwareWidget 
                                widget={widget} 
                                areaMapId={areaMapId}
                                editionId={editionId}
                                pageNumber={pageNumber}
                              />
                            </WidgetErrorBoundary>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </>
    );
  }
}