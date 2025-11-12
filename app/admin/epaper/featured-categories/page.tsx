'use client';

import { useState, useEffect } from 'react';
import { Minus } from 'lucide-react';

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

export default function FeaturedCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCategories();
  }, []);

  const fetchFeaturedCategories = async () => {
    try {
      const response = await fetch('/api/epaper/categories/featured');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch featured categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFeatured = async (id: number, title: string) => {
    if (!confirm(`Remove "${title}" from featured categories?`)) return;

    try {
      const getResponse = await fetch(`/api/epaper/categories/${id}`);
      const getResult = await getResponse.json();
      
      if (!getResult.success) {
        alert('Error: ' + getResult.error);
        return;
      }

      const category = getResult.data;

      const response = await fetch(`/api/epaper/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...category,
          is_featured: false,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Category removed from featured');
        fetchFeaturedCategories();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove category');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Featured Category Manager</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No featured categories. Mark categories as featured to display them here.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                {category.image_url && (
                  <img
                    src={category.image_url}
                    alt={category.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <button
                  onClick={() => removeFromFeatured(category.id, category.title)}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  title="Remove from Featured"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{category.title}</div>
                  <div className="text-sm text-gray-500">Alias: {category.alias}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
