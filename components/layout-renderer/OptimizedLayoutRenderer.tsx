'use client';

import React, { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SkeletonLoader, CardSkeleton } from '@/components/ui/SkeletonLoader';
import { OptimizedWidget as PerformanceWidget } from '@/components/ui/PerformanceOptimizer';

// Dynamic imports for components
const LazyEpaperPageDisplayWidget = dynamic(() => import('../epaper/EpaperPageDisplayWidget').then(mod => ({ default: mod.EpaperPageDisplayWidget })), {
  loading: () => <WidgetSkeleton type="epaper-page-display" />,
  ssr: false
});

const LazyEpaperPaginationWidget = dynamic(() => import('../epaper/EpaperPaginationWidget').then(mod => ({ default: mod.EpaperPaginationWidget })), {
  loading: () => <WidgetSkeleton type="epaper-pagination" />,
  ssr: false
});

const LazyEpaperCalendarWidget = dynamic(() => import('../epaper/EpaperCalendarWidget').then(mod => ({ default: mod.EpaperCalendarWidget })), {
  loading: () => <WidgetSkeleton type="epaper-calendar" />,
  ssr: false
});

const LazyNavigationWidget = dynamic(() => import('../navigation/NavigationWidget').then(mod => ({ default: mod.NavigationWidget })), {
  loading: () => <WidgetSkeleton type="navigation" />,
  ssr: false
});

const LazyMenuWidget = dynamic(() => import('../MenuWidget').then(mod => ({ default: mod.MenuWidget })), {
  loading: () => <WidgetSkeleton type="menu" />,
  ssr: false
});

const LazyEpaperAreaMapDisplayWidget = dynamic(() => import('../epaper/EpaperAreaMapDisplayWidget').then(mod => ({ default: mod.EpaperAreaMapDisplayWidget })), {
  loading: () => <WidgetSkeleton type="area-map-display" />,
  ssr: false
});

const LazyEpaperClipDisplayWidget = dynamic(() => import('../epaper/EpaperClipDisplayWidget').then(mod => ({ default: mod.EpaperClipDisplayWidget })), {
  loading: () => <WidgetSkeleton type="clip-display" />,
  ssr: false
});

const LazyEpaperFeaturedWidget = dynamic(() => import('../epaper/EpaperFeaturedWidget').then(mod => ({ default: mod.EpaperFeaturedWidget })), {
  loading: () => <WidgetSkeleton type="epaper-featured" />,
  ssr: false
});

interface OptimizedLayoutRendererProps {
  layout?: any;
  layoutName?: string;
  context?: any;
  isUserFacing?: boolean;
}

export function OptimizedLayoutRenderer({ 
  layout, 
  layoutName,
  context, 
  isUserFacing = false 
}: OptimizedLayoutRendererProps) {
  
  // If layoutName is provided, fetch the layout
  const [layoutData, setLayoutData] = useState(layout);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted && layoutName && !layout && !layoutData) {
      fetchLayout();
    }
  }, [layoutName, layout, layoutData, mounted]);
  
  const fetchLayout = useCallback(async () => {
    if (!layoutName) return;
    
    try {
      setLoading(true);
      
      // Add timeout and abort controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(`/api/layouts/${encodeURIComponent(layoutName)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setLayoutData(result.data);
      } else {
        throw new Error(result.message || 'Layout not found');
      }
    } catch (error) {
      console.error('Layout fetch error:', error);
      
      // Set configurable fallback layout instead of hardcoded
      const fallbackLayout = {
        widgets: [
          { type: 'navigation', enabled: true, config: {} },
          { type: 'epaper-featured', enabled: true, config: {} }
        ]
      };
      
      setLayoutData(fallbackLayout);
    } finally {
      setLoading(false);
    }
  }, [layoutName]);
  
  // Memoize layout processing for performance with comprehensive error handling
  const processedLayout = useMemo(() => {
    const currentLayout = layoutData || layout;
    if (!currentLayout) return null;
    
    try {
      let widgets: any[] = [];
      
      if (currentLayout.structure) {
        // Parse layout structure with better error handling
        let layoutStructure;
        try {
          layoutStructure = typeof currentLayout.structure === 'string' 
            ? JSON.parse(currentLayout.structure) 
            : currentLayout.structure;
        } catch (parseError) {
          console.warn('Failed to parse layout structure:', parseError);
          return null;
        }
        
        // Extract widgets from layout structure with comprehensive validation
        if (layoutStructure && layoutStructure.rows && Array.isArray(layoutStructure.rows)) {
          layoutStructure.rows.forEach((row: any) => {
            if (row && row.columns && Array.isArray(row.columns)) {
              row.columns.forEach((column: any) => {
                if (column && column.widgets && Array.isArray(column.widgets)) {
                  column.widgets.forEach((widget: any) => {
                    if (widget && widget.type && typeof widget.type === 'string') {
                      widgets.push({
                        type: widget.type,
                        enabled: widget.enabled !== false,
                        config: widget.config || {},
                        deviceVisibility: widget.deviceVisibility || 'both',
                        ...widget
                      });
                    }
                  });
                }
                
                // Handle nested rows
                if (column && column.rows && Array.isArray(column.rows)) {
                  column.rows.forEach((nestedRow: any) => {
                    if (nestedRow && nestedRow.columns && Array.isArray(nestedRow.columns)) {
                      nestedRow.columns.forEach((nestedColumn: any) => {
                        if (nestedColumn && nestedColumn.widgets && Array.isArray(nestedColumn.widgets)) {
                          nestedColumn.widgets.forEach((widget: any) => {
                            if (widget && widget.type && typeof widget.type === 'string') {
                              widgets.push({
                                type: widget.type,
                                enabled: widget.enabled !== false,
                                config: widget.config || {},
                                deviceVisibility: widget.deviceVisibility || 'both',
                                ...widget
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      } else if (currentLayout.widgets && Array.isArray(currentLayout.widgets)) {
        // Direct widgets array with validation
        widgets = currentLayout.widgets.filter((w: any) => w && w.type && typeof w.type === 'string').map((w: any) => ({
          type: w.type,
          enabled: w.enabled !== false,
          config: w.config || {},
          deviceVisibility: w.deviceVisibility || 'both',
          ...w
        }));
      }
      
      // Filter widgets for user-facing pages
      if (isUserFacing) {
        widgets = widgets.filter((widget: any) => 
          !widget.adminOnly && widget.enabled !== false
        );
      }
      
      return { widgets };
    } catch (error) {
      console.error('Error processing layout:', error);
      return null;
    }
  }, [layoutData, layout, isUserFacing]);

  if (!processedLayout) {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading layout...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="optimized-layout">
      {processedLayout.widgets?.map((widget: any, index: number) => (
        <Suspense 
          key={`${widget.type}-${index}`}
          fallback={<WidgetSkeleton type={widget.type} />}
        >
          <OptimizedWidget 
            widget={widget} 
            context={context}
            isUserFacing={isUserFacing}
            priority={index < 2} // Prioritize first 2 widgets
          />
        </Suspense>
      ))}
    </div>
  );
}

function OptimizedWidget({ 
  widget, 
  context, 
  isUserFacing, 
  priority 
}: { 
  widget: any; 
  context: any; 
  isUserFacing: boolean;
  priority: boolean;
}) {
  // Use performance optimizer for non-priority widgets
  if (!priority && typeof window !== 'undefined') {
    return (
      <PerformanceWidget type={widget.type} priority="low">
        <WidgetRenderer widget={widget} context={context} isUserFacing={isUserFacing} />
      </PerformanceWidget>
    );
  }

  return <WidgetRenderer widget={widget} context={context} isUserFacing={isUserFacing} />;
}

function WidgetRenderer({ widget, context, isUserFacing }: any) {
  const { type, config = {}, props = {} } = widget;
  const widgetProps = { ...props, ...config, context };

  // Lightweight widget mapping for user pages
  const userWidgets = {
    'epaper-page-display': LazyEpaperPageDisplayWidget,
    'epaper-pagination': LazyEpaperPaginationWidget,
    'epaper-calendar': LazyEpaperCalendarWidget,
    'epaper-featured': LazyEpaperFeaturedWidget,
    'navigation': LazyNavigationWidget,
    'menu': LazyMenuWidget,
  };

  // Admin widgets (heavier components)
  const adminWidgets = {
    'area-map-display': LazyEpaperAreaMapDisplayWidget,
    'clip-display': LazyEpaperClipDisplayWidget,
    // Add more admin widgets as needed
  };

  // Simple widgets (render as functions)
  const simpleWidgets = {
    'social': () => <div className="p-4 text-center text-gray-500">Social Widget</div>,
    'text': ({ content }: any) => <div className="p-4" dangerouslySetInnerHTML={{ __html: content }} />,
    'html': ({ content }: any) => <div className="p-4" dangerouslySetInnerHTML={{ __html: content }} />,
  };

  const widgetMap = isUserFacing ? userWidgets : { ...userWidgets, ...adminWidgets };

  // Check simple widgets first
  if (simpleWidgets[type as keyof typeof simpleWidgets]) {
    const SimpleWidget = simpleWidgets[type as keyof typeof simpleWidgets];
    return SimpleWidget(widgetProps);
  }

  // Check component widgets
  const WidgetComponent = widgetMap[type as keyof typeof widgetMap];
  if (WidgetComponent) {
    return <WidgetComponent {...widgetProps} />;
  }

  return (
    <div className="p-4 border border-dashed border-gray-300 rounded">
      <p className="text-gray-500 text-sm">Widget type "{type}" not found</p>
      <p className="text-xs text-gray-400 mt-1">Available types: {Object.keys({ ...widgetMap, ...simpleWidgets }).join(', ')}</p>
    </div>
  );
}

function WidgetSkeleton({ type }: { type: string }) {
  const skeletonMap = {
    'epaper-page-display': () => (
      <div className="space-y-4">
        <SkeletonLoader variant="text" width="40%" height="32px" />
        <SkeletonLoader variant="image" height="600px" />
      </div>
    ),
    'epaper-pagination': () => (
      <div className="flex justify-center space-x-2 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} variant="button" width="40px" height="40px" />
        ))}
      </div>
    ),
    'epaper-calendar': () => <CardSkeleton />,
    'navigation': () => (
      <div className="flex space-x-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} variant="button" width="80px" />
        ))}
      </div>
    ),
    default: () => <CardSkeleton />
  };

  const SkeletonComponent = skeletonMap[type as keyof typeof skeletonMap] || skeletonMap.default;
  return <SkeletonComponent />;
}