'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useFormValidation, getFieldError, hasFieldError } from '@/hooks/useFormValidation';
import { categorySchema, type CategoryFormData } from '@/lib/validations/category';

export default function CreateCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useFormValidation(categorySchema, {
    defaultValues: {
      title: '',
      alias: '',
      description: '',
      image_url: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      robots: 'index, follow' as const,
      is_active: true,
      is_featured: false,
      display_order: 0,
    },
  });

  const watchedTitle = watch('title');

  // Auto-generate alias from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const alias = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setValue('alias', alias);
  };

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true);

    try {
      const response = await fetch('/api/epaper/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        alert('Category created successfully!');
        router.push('/admin/epaper/categories');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/epaper/categories"
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-500">Create Category</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg mb-4">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'basic'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Basic
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'seo'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              SEO
            </button>
          </div>
        </div>

        {/* Basic Tab */}
        {activeTab === 'basic' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Category Title *
              </label>
              <input
                type="text"
                {...register('title', {
                  onChange: handleTitleChange,
                })}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'title') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Mumbai Edition"
              />
              {hasFieldError(errors, 'title') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'title')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Alias *
              </label>
              <input
                type="text"
                {...register('alias')}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'alias') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., mumbai"
              />
              {hasFieldError(errors, 'alias') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'alias')}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier (auto-generated from title)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'description') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Brief description of this category"
              />
              {hasFieldError(errors, 'description') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'description')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Image URL
              </label>
              <input
                type="text"
                {...register('image_url')}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'image_url') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/image.jpg"
              />
              {hasFieldError(errors, 'image_url') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'image_url')}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-500">Active</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('is_featured')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-500">Featured</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  {...register('display_order', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasFieldError(errors, 'display_order') ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {hasFieldError(errors, 'display_order') && (
                  <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'display_order')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Search Engine Optimization</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Custom Title
              </label>
              <input
                type="text"
                {...register('meta_title')}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'meta_title') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="This title will be used in <title> </title> tag"
              />
              {hasFieldError(errors, 'meta_title') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'meta_title')}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                This title will be used in &lt;title&gt; &lt;/title&gt; tag
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Meta Description
              </label>
              <textarea
                {...register('meta_description')}
                rows={3}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'meta_description') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {hasFieldError(errors, 'meta_description') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'meta_description')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Meta Keywords
              </label>
              <textarea
                {...register('meta_keywords')}
                rows={2}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'meta_keywords') ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {hasFieldError(errors, 'meta_keywords') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'meta_keywords')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Robots
              </label>
              <select
                {...register('robots')}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasFieldError(errors, 'robots') ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="index, follow">Index, Follow</option>
                <option value="noindex, nofollow">No Index, No Follow</option>
                <option value="index, nofollow">Index, No Follow</option>
                <option value="noindex, follow">No Index, Follow</option>
              </select>
              {hasFieldError(errors, 'robots') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError(errors, 'robots')}</p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading || !isValid}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Category'}
          </button>
          <Link
            href="/admin/epaper/categories"
            className="px-6 py-2 bg-gray-200 text-gray-500 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
