import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus (can be annoying for users)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Editions
  editions: ['editions'] as const,
  edition: (id: string | number) => ['editions', id] as const,
  editionPages: (id: string | number) => ['editions', id, 'pages'] as const,
  
  // Categories
  categories: ['categories'] as const,
  category: (id: string | number) => ['categories', id] as const,
  featuredCategories: ['categories', 'featured'] as const,
  
  // Pages
  pages: ['pages'] as const,
  page: (id: string | number) => ['pages', id] as const,
  pageAreaMaps: (id: string | number) => ['pages', id, 'area-maps'] as const,
  
  // Area Maps
  areaMaps: ['area-maps'] as const,
  areaMap: (id: string | number) => ['area-maps', id] as const,
  
  // Media
  media: ['media'] as const,
  mediaFile: (id: string | number) => ['media', id] as const,
  
  // Users
  users: ['users'] as const,
  user: (id: string | number) => ['users', id] as const,
  
  // Settings
  settings: ['settings'] as const,
  setting: (key: string) => ['settings', key] as const,
} as const;