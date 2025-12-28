'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
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
  
  console.log('🎨 OptimizedLayoutRenderer mounted:', { layoutName, hasLayout: !!layout, loading, mounted });
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { layoutName, layout, hasLayoutData: !!layoutData, mounted });
    if (mounted && layoutName && !layout && !layoutData) {
      console.log('🚀 Starting layout fetch...');
      fetchLayout();
    }
  }, [layoutName, layout, layoutData, mounted]);
  
  const fetchLayout = async () => {
    if (!layoutName) return;
    
    try {
      setLoading(true);
      console.log('�  Fetching layout:', layoutName);
      const response = await fetch(`/api/layouts/${encodeURIComponent(layoutName)}`);
      console.log('� Layout AAPI response status:', response.status);
      const result = await response.json();
      console.log('📄 Layout API result:', result);
      
      if (result.success && result.data) {
        console.log('✅ Layout loaded:', result.data);
        console.log('📊 Layout structure:', result.data.structure);
        setLayoutData(result.data);
      } else {
        console.warn('⚠️ Layout not found, using fallback');
        // Fallback layout for homepage
        setLayoutData({
          widgets: [
            { type: 'navigation', enabled: true },
            { type: 'epaper-featured', enabled: true },
            { type: 'epaper-calendar', enabled: true }
          ]
        });
      }
    } catch (error) {
      console.error('❌ Error fetching layout:', error);
      // Fallback layout
      setLayoutData({
        widgets: [
          { type: 'navigation', enabled: true },
          { type: 'epaper-featured', enabled: true }
        ]
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Memoize layout processing for performance
  const processedLayout = useMemo(() => {
    const currentLayout = layoutData || layout;
    if (!currentLayout) return null;
    
    // Handle different layout structures
    let widgets = [];
    
    if (currentLayout.structure) {
      // Parse layout structure if it's a string
      const layoutStructure = typeof currentLayout.structure === 'string' 
        ? JSON.parse(currentLayout.structure) 
        : currentLayout.structure;
      
      // Extract widgets from layout structure
      if (layoutStructure.rows) {
        layoutStructure.rows.forEach((row: any) => {
          row.columns?.forEach((column: any) => {
            column.widgets?.forEach((widget: any) => {
              widgets.push({
                type: widget.type,
                enabled: true,
                config: widget.config || {},
                ...widget
              });
            });
          });
        });
      }
    } else if (currentLayout.widgets) {
      // Direct widgets array
      widgets = currentLayout.widgets;
    }
    
    // Simplify layout for user-facing pages
    if (isUserFacing) {
      widgets = widgets.filter((widget: any) => 
        !widget.adminOnly && widget.enabled !== false
      );
    }
    
    return { widgets };
  }, [layoutData, layout, isUserFacing]);

  console.log('🎨 Processed layout:', processedLayout);

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