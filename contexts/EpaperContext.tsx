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
  refreshPages: () => void;
}

const EpaperContext = createContext<EpaperContextType | undefined>(undefined);

export function EpaperProvider({ 
  children, 
  editionId,
  categoryId: initialCategoryId = null
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
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId);

  // Fetch edition details and pages on mount
  useEffect(() => {
    if (editionId) {
      fetchEditionDetails();
      fetchPages();
    }
  }, [editionId]);

  const fetchEditionDetails = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const data = await response.json();
      if (data.success && data.data?.category_id) {
        setCategoryId(data.data.category_id);
        console.log('📰 Edition category_id:', data.data.category_id);
      }
    } catch (error) {
      console.error('Failed to fetch edition details:', error);
    }
  };

  // Sync currentPage with URL
  useEffect(() => {
    const pageParam = searchParams?.get('page');
    const pageNum = pageParam ? parseInt(pageParam) : 1;
    setCurrentPageState(pageNum);
  }, [searchParams]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      // Fetch pages WITHOUT watermark (only for clips/area-maps)
      const timestamp = Date.now();
      const url = `/api/editions/${editionId}/pages?_t=${timestamp}`;
      
      console.log('🚀 EpaperContext - Fetching pages from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📡 EpaperContext - API Response:', data);
      
      if (data.success) {
        console.log('📄 EpaperContext - Pages fetched:', data.data?.length);
        setPages(data.data || []);
      } else {
        console.error('❌ EpaperContext - API Error:', data.error);
      }
    } catch (error) {
      console.error('💥 EpaperContext - Network Error:', error);
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
        refreshPages: fetchPages,
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

// Safe hook that doesn't throw error - for ContextAwareWidget
export function useEpaperSafe() {
  try {
    const context = useContext(EpaperContext);
    return context;
  } catch {
    return undefined;
  }
}
