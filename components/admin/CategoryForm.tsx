'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import MediaBrowser from '@/components/page-manager/MediaBrowser';

interface CategoryFormData {
  title: string;
  alias: string;
  description: string;
  parent_id: null | number;
  image_url: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  robots: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CategoryFormData>;
  categoryId?: string;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  loading?: boolean;
}

export default function CategoryForm({ 
  mode, 
  initialData = {}, 
  categoryId, 
  onSubmit, 
  loading = false 
}: CategoryFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    title: '',
    alias: '',
    description: '',
    parent_id: null,
    image_url: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    robots: 'index, follow',
    is_active: true,
    is_featured: false,
    display_order: 0,
    ...initialData
  });

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-generate alias from title (only if alias is empty)
    if (name === 'title' && !formData.alias) {
      const alias = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, alias }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('files', file);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();
      if (result.success && result.data?.[0]) {
        setFormData(prev => ({ ...prev, image_url: result.data[0].url }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const openMediaBrowser = () => {
    setShowMediaBrowser(true);
  };

  const handleMediaSelect = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    setShowMediaBrowser(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

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
        <h1 className="text-2xl font-bold text-gray-500">
          {mode === 'create' ? 'Create Category' : 'Edit Category'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg mb-4">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'basic'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
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
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              SEO
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('advanced')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'advanced'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Advanced
            </button>
          </div>

          <div className="p-6">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alias *
                  </label>
                  <input
                    type="text"
                    name="alias"
                    value={formData.alias}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="URL-friendly alias (auto-generated from title)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL-friendly version of the title. Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openMediaBrowser}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Browse Media
                    </button>
                    <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      {uploading ? 'Uploading...' : 'Upload New'}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Browse existing media or upload a new image
                  </p>
                  {formData.image_url && (
                    <div className="mt-3">
                      <img
                        src={formData.image_url}
                        alt="Category"
                        className="w-32 h-32 object-cover border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      name="display_order"
                      value={formData.display_order}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SEO title for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description for search engines (150-160 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Comma-separated keywords"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Robots
                  </label>
                  <select
                    name="robots"
                    value={formData.robots}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="index, follow">Index, Follow</option>
                    <option value="noindex, nofollow">No Index, No Follow</option>
                    <option value="index, nofollow">Index, No Follow</option>
                    <option value="noindex, follow">No Index, Follow</option>
                  </select>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Category
                  </label>
                  <select
                    name="parent_id"
                    value={formData.parent_id || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Parent (Top Level)</option>
                    {/* TODO: Add parent categories options */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Direct)
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Direct image URL (alternative to file upload)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Update Category'}
          </button>
          
          <Link
            href="/admin/epaper/categories"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Media Browser Modal */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={handleMediaSelect}
        accept="image/*"
      />
    </div>
  );
}