import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

// Types
interface Category {
  id: number;
  title: string;
  alias: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  robots: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  archive_layout?: string;
}

interface CreateCategoryData {
  title: string;
  alias: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
}

interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: number;
}

// API Functions
const categoriesApi = {
  // Get all categories
  getAll: async (): Promise<{ data: Category[] }> => {
    const response = await fetch('/api/epaper/categories', {
      headers: {
        'Cache-Control': 'max-age=300', // 5 minutes client cache
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

  // Get featured categories
  getFeatured: async (): Promise<{ data: Category[] }> => {
    const response = await fetch('/api/epaper/categories?featured=true', {
      headers: {
        'Cache-Control': 'max-age=600', // 10 minutes client cache
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch featured categories');
    }
    return response.json();
  },

  // Get single category
  getById: async (id: string | number): Promise<{ data: Category }> => {
    const response = await fetch(`/api/categories/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch category ${id}`);
    }
    return response.json();
  },

  // Create category
  create: async (data: CreateCategoryData): Promise<{ data: Category }> => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    return response.json();
  },

  // Update category
  update: async (data: UpdateCategoryData): Promise<{ data: Category }> => {
    const response = await fetch(`/api/categories/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update category');
    }
    return response.json();
  },

  // Delete category
  delete: async (id: string | number): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
    return response.json();
  },
};

// Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.getAll,
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useFeaturedCategories = () => {
  return useQuery({
    queryKey: queryKeys.featuredCategories,
    queryFn: categoriesApi.getFeatured,
    select: (data) => data.data,
    // Cache featured categories for longer since they change less frequently
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCategory = (id: string | number) => {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => categoriesApi.getById(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: (data) => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      
      // If it's featured, invalidate featured categories
      if (data.data.is_featured) {
        queryClient.invalidateQueries({ queryKey: queryKeys.featuredCategories });
      }
      
      // Add to cache
      queryClient.setQueryData(queryKeys.category(data.data.id), { data: data.data });
    },
    onError: (error) => {
      console.error('Failed to create category:', error);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.update,
    onSuccess: (data) => {
      // Update specific category in cache
      queryClient.setQueryData(queryKeys.category(data.data.id), { data: data.data });
      
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      
      // Invalidate featured categories (featured status might have changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.featuredCategories });
    },
    onError: (error) => {
      console.error('Failed to update category:', error);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.category(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.featuredCategories });
    },
    onError: (error) => {
      console.error('Failed to delete category:', error);
    },
  });
};