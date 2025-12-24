'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Star, Settings } from 'lucide-react';
import Link from 'next/link';
import ActionIcons from '@/components/ActionIcons';

interface Category {
  id: number;
  title: string;
  alias: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  image_url?: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/epaper/categories', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (id: number, currentFeatured: boolean, title: string) => {
    const action = currentFeatured ? 'remove from featured' : 'add to featured';
    if (!confirm(`Are you sure you want to ${action} "${title}"?`)) return;

    try {
      // First get the full category data
      const getResponse = await fetch(`/api/epaper/categories/${id}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const getResult = await getResponse.json();
      
      if (!getResult.success) {
        alert('Error: ' + getResult.error);
        return;
      }

      const category = getResult.data;

      // Update with all fields
      const response = await fetch(`/api/epaper/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...category,
          is_featured: !currentFeatured,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Immediately update local state
        setCategories(categories.map(cat => 
          cat.id === id ? { ...cat, is_featured: !currentFeatured } : cat
        ));
        alert(`Category ${currentFeatured ? 'removed from' : 'added to'} featured successfully`);
        // Also fetch fresh data
        setTimeout(() => fetchCategories(), 500);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to toggle category');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/epaper/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        alert('Category deleted successfully');
        fetchCategories();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete category');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-500">Category Manager</h1>
        <Link
          href="/admin/epaper/categories/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Category
        </Link>
      </div>

      {/* Categories List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories found. Create your first category!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <ActionIcons.Group>
                    <Link href={`/admin/epaper/categories/edit/${category.id}`}>
                      <ActionIcons.Edit title="Edit Category" />
                    </Link>
                    <ActionIcons.Delete
                      onClick={() => handleDelete(category.id, category.title)}
                      title="Delete Category"
                    />
                    <Link href={`/admin/epaper/categories/${category.id}/watermark-settings`}>
                      <button
                        className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                        title="Watermark Settings"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </Link>
                  </ActionIcons.Group>

                  {/* Toggle Featured Button */}
                  {category.is_featured ? (
                    <ActionIcons.Remove
                      onClick={() => toggleCategory(category.id, category.is_featured, category.title)}
                      title="Remove from Featured"
                    />
                  ) : (
                    <ActionIcons.Add
                      onClick={() => toggleCategory(category.id, category.is_featured, category.title)}
                      title="Add to Featured"
                    />
                  )}

                  {/* Featured Star */}
                  {category.is_featured && (
                    <button
                      className="p-2 bg-yellow-500 text-white rounded"
                      title="Featured"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  )}

                  {/* Category Info */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-500">
                      {category.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      Alias: {category.alias}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {category.is_active ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
