import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

// Types
interface Edition {
  id: number;
  title: string;
  description?: string;
  date: string;
  category_id: number;
  is_published: boolean;
  pdf_url?: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

interface EditionPage {
  id: number;
  edition_id: number;
  page_number: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface CreateEditionData {
  title: string;
  description?: string;
  date: string;
  category_id: number;
  is_published?: boolean;
}

interface UpdateEditionData extends Partial<CreateEditionData> {
  id: number;
}

// API Functions
const editionsApi = {
  // Get all editions
  getAll: async (): Promise<{ data: Edition[] }> => {
    const response = await fetch('/api/editions');
    if (!response.ok) {
      throw new Error('Failed to fetch editions');
    }
    return response.json();
  },

  // Get single edition
  getById: async (id: string | number): Promise<{ data: Edition }> => {
    const response = await fetch(`/api/editions/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch edition ${id}`);
    }
    return response.json();
  },

  // Get edition pages
  getPages: async (id: string | number): Promise<{ data: EditionPage[] }> => {
    const response = await fetch(`/api/editions/${id}/pages`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pages for edition ${id}`);
    }
    return response.json();
  },

  // Create edition
  create: async (data: CreateEditionData): Promise<{ data: Edition }> => {
    const response = await fetch('/api/editions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create edition');
    }
    return response.json();
  },

  // Update edition
  update: async (data: UpdateEditionData): Promise<{ data: Edition }> => {
    const response = await fetch(`/api/editions/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update edition');
    }
    return response.json();
  },

  // Delete edition
  delete: async (id: string | number): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/editions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete edition');
    }
    return response.json();
  },
};

// Hooks
export const useEditions = () => {
  return useQuery({
    queryKey: queryKeys.editions,
    queryFn: editionsApi.getAll,
    select: (data) => data.data, // Extract just the data array
  });
};

export const useEdition = (id: string | number) => {
  return useQuery({
    queryKey: queryKeys.edition(id),
    queryFn: () => editionsApi.getById(id),
    select: (data) => data.data, // Extract just the data object
    enabled: !!id, // Only run query if id is provided
  });
};

export const useEditionPages = (id: string | number) => {
  return useQuery({
    queryKey: queryKeys.editionPages(id),
    queryFn: () => editionsApi.getPages(id),
    select: (data) => data.data, // Extract just the data array
    enabled: !!id, // Only run query if id is provided
  });
};

// Mutations
export const useCreateEdition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editionsApi.create,
    onSuccess: (data) => {
      // Invalidate and refetch editions list
      queryClient.invalidateQueries({ queryKey: queryKeys.editions });
      
      // Add the new edition to the cache
      queryClient.setQueryData(queryKeys.edition(data.data.id), { data: data.data });
    },
    onError: (error) => {
      console.error('Failed to create edition:', error);
    },
  });
};

export const useUpdateEdition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editionsApi.update,
    onSuccess: (data) => {
      // Update the specific edition in cache
      queryClient.setQueryData(queryKeys.edition(data.data.id), { data: data.data });
      
      // Invalidate editions list to refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.editions });
    },
    onError: (error) => {
      console.error('Failed to update edition:', error);
    },
  });
};

export const useDeleteEdition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editionsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.edition(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.editionPages(deletedId) });
      
      // Invalidate editions list
      queryClient.invalidateQueries({ queryKey: queryKeys.editions });
    },
    onError: (error) => {
      console.error('Failed to delete edition:', error);
    },
  });
};