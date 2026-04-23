'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HeaderContextType {
  headerLayout: string | null;
  footerLayout: string | null;
  isLoading: boolean;
  setHeaderLayout: (layout: string | null) => void;
  setFooterLayout: (layout: string | null) => void;
  refreshLayouts: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerLayout, setHeaderLayout] = useState<string | null>('Site Header');
  const [footerLayout, setFooterLayout] = useState<string | null>('Site Footer');
  const [isLoading, setIsLoading] = useState(false);

  const loadLayouts = async () => {
    try {
      setIsLoading(true);
      // Remove cache busting - allow browser caching for better performance
      const response = await fetch(`/api/settings/site`, {
        next: { revalidate: 60 }, // Cache for 60 seconds
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const headerName = data.data?.site_header_layout || 'Site Header';
          const footerName = data.data?.site_footer_layout || 'Site Footer';
          
          setHeaderLayout(headerName);
          setFooterLayout(footerName);
        }
      }
    } catch (error) {
      // Silent fail - use default layouts
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLayouts = () => {
    loadLayouts();
  };

  // Load layouts on mount
  useEffect(() => {
    loadLayouts();
  }, []);

  return (
    <HeaderContext.Provider value={{
      headerLayout,
      footerLayout,
      isLoading,
      setHeaderLayout,
      setFooterLayout,
      refreshLayouts
    }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}