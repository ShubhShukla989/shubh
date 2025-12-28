'use client';

import { useState, useEffect } from 'react';

interface Widget {
  deviceVisibility?: 'both' | 'mobile-only' | 'desktop-only';
  [key: string]: any;
}

interface Column {
  widgets?: Widget[];
  deviceVisibility?: 'both' | 'mobile-only' | 'desktop-only';
  [key: string]: any;
}

interface Row {
  deviceVisibility?: 'both' | 'mobile-only' | 'desktop-only';
  columns?: Column[];
  [key: string]: any;
}

// Hook to get column and row visibility with proper device detection
export function useColumnVisibility() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const isVisible = (deviceVisibility?: 'both' | 'mobile-only' | 'desktop-only') => {
    if (!isClient) return true; // Show everything during SSR
    
    switch (deviceVisibility) {
      case 'mobile-only':
        return isMobile;
      case 'desktop-only':
        return !isMobile;
      case 'both':
      case undefined:
      case null:
      default:
        return true;
    }
  };

  return {
    isColumnVisible: (column: Column) => {
      return isVisible(column.deviceVisibility);
    },
    isRowVisible: (row: Row) => {
      return isVisible(row.deviceVisibility);
    },
    isWidgetVisible: (widget: Widget) => {
      return isVisible(widget.deviceVisibility);
    },
    isMobile,
    isClient
  };
}