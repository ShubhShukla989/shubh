'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function QueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [mounted, setMounted] = useState(false);
  
  // Create a new QueryClient instance for each provider
  // This ensures proper SSR hydration
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Elite: Data stays fresh for 60 seconds (balance between freshness and speed)
        staleTime: 60 * 1000,
        // Keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests once
        retry: 1,
        // Don't refetch on window focus (admin dashboard behavior)
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect
        refetchOnReconnect: false,
        // Refetch on mount only if stale
        refetchOnMount: false,
      },
      mutations: {
        // Retry mutations once for better UX
        retry: 1,
      },
    },
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query devtools disabled */}
    </QueryClientProvider>
  );
}