'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Page {
  id: number;
  page_number: number;
  title?: string;
  image_url?: string;
  thumbnail_url?: string;
  area_map_config?: {
    areas: Array<{
      coords: string;
      shape: 'rect' | 'circle' | 'poly';
      linkedPageNumber: number;
    }>;
  };
}

interface EpaperContextType {
  editionId: string;
  categoryId: number | null;
  isClipping: boolean;
  setIsClipping: (value: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pages: Page[];
  zoom: number;
  setZoom: (zoom: number) => void;
  loading: boolean;
}

const EpaperContext = createContext<EpaperContextType | undefined>(undefined);

export function EpaperProvider({ 
  children, 
  editionId,
  categoryId = null
}: { 
  children: ReactNode;
  editionId: string;
  categoryId?: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isClipping, setIsClipping] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPageState] = useState<number>(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch pages on mount
  useEffect(() => {
    if (editionId) {
      fetchPages();
    }
  }, [editionId]);

  // Sync currentPage with URL
  useEffect(() => {
    const pageParam = searchParams?.get('page');
    const pageNum = pageParam ? parseInt(pageParam) : 1;
    setCurrentPageState(pageNum);
  }, [searchParams]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/editions/${editionId}/pages`);
      const data = await response.json();
      if (data.success) {
        setPages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentPage = (page: number) => {
    setCurrentPageState(page);
    router.push(`/epaper/view/${editionId}?page=${page}`);
  };

  return (
    <EpaperContext.Provider
      value={{
        editionId,
        categoryId,
        isClipping,
        setIsClipping,
        currentPage,
        setCurrentPage,
        pages,
        zoom,
        setZoom,
        loading,
      }}
    >
      {children}
    </EpaperContext.Provider>
  );
}

export function useEpaper() {
  const context = useContext(EpaperContext);
  if (context === undefined) {
    throw new Error('useEpaper must be used within an EpaperProvider');
  }
  return context;
}
