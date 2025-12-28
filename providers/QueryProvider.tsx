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
        // EXTREME performance for 1000+ users - cache for 30 minutes
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000, // Keep in memory for 1 hour
        // Retry failed requests for better UX
        retry: 3,
        // Don't refetch on window focus to reduce server load
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect to reduce server load
        refetchOnReconnect: false,
        // Only refetch on mount if data is very stale
        refetchOnMount: 'always',
      },
      mutations: {
        // Retry mutations for better UX
        retry: 2,
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