import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
interface Edition {
  id: number;
  title: string;
  date: string;
  status: string;
  // ... other fields
}

// Query keys (centralized for cache management)
export const editionKeys = {
  all: ['editions'] as const,
  lists: () => [...editionKeys.all, 'list'] as const,
  list: (filters: string) => [...editionKeys.lists(), { filters }] as const,
  details: () => [...editionKeys.all, 'detail'] as const,
  detail: (id: number) => [...editionKeys.details(), id] as const,
};

/**
 * Elite: Fetch editions with automatic caching
 * First call: 400ms (server)
 * Subsequent calls: 0ms (memory cache)
 */
export function useEditions() {
  return useQuery({
    queryKey: editionKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/editions');
      if (!response.ok) throw new Error('Failed to fetch editions');
      return response.json();
    },
    // Override defaults if needed
    staleTime: 60 * 1000, // 60 seconds
  });
}

/**
 * Elite: Fetch single edition with caching
 */
export function useEdition(id: number) {
  return useQuery({
    queryKey: editionKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/editions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch edition');
      return response.json();
    },
    enabled: !!id, // Only fetch if id exists
  });
}

/**
 * Elite: Delete edition with optimistic update
 */
export function useDeleteEdition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/editions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete edition');
      return response.json();
    },
    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: editionKeys.lists() });

      // Snapshot previous value
      const previousEditions = queryClient.getQueryData(editionKeys.lists());

      // Optimistically update cache
      queryClient.setQueryData(editionKeys.lists(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((edition: Edition) => edition.id !== deletedId),
        };
      });

      return { previousEditions };
    },
    // Rollback on error
    onError: (err, deletedId, context) => {
      if (context?.previousEditions) {
        queryClient.setQueryData(editionKeys.lists(), context.previousEditions);
      }
    },
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editionKeys.lists() });
    },
  });
}

/**
 * Elite: Create edition with cache update
 */
export function useCreateEdition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Edition>) => {
      const response = await fetch('/api/editions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create edition');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: editionKeys.lists() });
    },
  });
}

/**
 * Elite: Prefetch edition (call on hover)
 */
export function usePrefetchEdition() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: editionKeys.detail(id),
      queryFn: async () => {
        const response = await fetch(`/api/editions/${id}`);
        if (!response.ok) throw new Error('Failed to fetch edition');
        return response.json();
      },
    });
  };
}
