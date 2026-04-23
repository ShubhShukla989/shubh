'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Edit, Trash2 } from 'lucide-react';
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
  parent_id?: number;
  children?: Category[];
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
      const response = await fetch('/api/epaper/categories');
      const result = await response.json();
      if (result.success) {
        const categoriesData = result.data || [];
        // Build hierarchical structure
        const hierarchicalCategories = buildCategoryTree(categoriesData);
        setCategories(hierarchicalCategories);
      }
    } catch (error) {
      // Failed to fetch categories
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical category tree
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
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
      alert('Failed to delete category');
    }
  };

  // Render category row with hierarchy
  const renderCategoryRow = (category: Category, level: number = 0) => {
    const indent = level * 20; // 20px indent per level
    
    return (
      <div key={category.id}>
        {/* Main Category Row */}
        <div
          className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Hierarchy Indicator */}
            {level > 0 && (
              <div className="text-gray-400 text-sm">
                {'└─'.repeat(level)}
              </div>
            )}

            {/* Category Image Thumbnail */}
            {category.image_url && (
              <img
                src={category.image_url}
                alt={category.title}
                className="w-12 h-12 object-cover rounded border"
              />
            )}

            {/* Edit Button */}
            <Link
              href={`/admin/epaper/categories/edit/${category.id}`}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Link>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(category.id, category.title)}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Add Sub-Category Button */}
            <Link
              href={`/admin/epaper/categories/create?parent_id=${category.id}`}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
              title="Add Sub-Category"
            >
              + Sub
            </Link>

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
                {level > 0 && (
                  <span className="text-xs text-gray-400 ml-2">
                    (Sub-category Level {level})
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Alias: {category.alias}
              </div>
              {category.children && category.children.length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  {category.children.length} sub-categor{category.children.length === 1 ? 'y' : 'ies'}
                </div>
              )}
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

        {/* Render Children */}
        {category.children && category.children.map(child => 
          renderCategoryRow(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-500">Category Manager</h1>
        <Link
          href="/admin/epaper/categories/create"
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-100 transition-colors"
        >
          <ActionIcons.Add className="!p-0 !bg-transparent" />
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
            {categories.map((category) => renderCategoryRow(category))}
          </div>
        )}
      </div>
    </div>
  );
}
