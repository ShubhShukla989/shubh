'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, Layout } from 'lucide-react';
import { pageService, PageFormData } from '@/lib/services/pageService';
import SEOSection from '@/components/page-manager/SEOSection';
import MediaBrowser from '@/components/page-manager/MediaBrowser';
import { LayoutBuilder } from '@/components/layout-builder/LayoutBuilder';
import { LayoutStructure } from '@/components/layout-builder/types';
import dynamic from 'next/dynamic';

// Dynamically import TinyMCE to avoid SSR issues - using improved loading
const Editor = dynamic(() => import('@tinymce/tinymce-react').then((mod) => mod.Editor as any), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading editor...</p>
        <p className="text-xs text-gray-500 mt-1">Initializing TinyMCE...</p>
      </div>
    </div>
  ),
});

type Layout = {
  id: number;
  name: string;
  structure: any;
  status: string;
  created_at: Date;
  updated_at: Date;
  custom_css: string;
  custom_js: string;
};

export default function CreatePage() {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  
  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    alias: '',
    description: '',
    content: '',
    status: 'Draft',
    seo: {
      robots: 'index, follow',
      twitterCard: 'summary_large_image',
    },
  });

  const [contentMode, setContentMode] = useState<'editor' | 'designer'>('editor');
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [selectedLayoutName, setSelectedLayoutName] = useState<string>('');
  const [layoutStructure, setLayoutStructure] = useState<LayoutStructure>({ rows: [] });
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<string>('');
  const [savedPageData, setSavedPageData] = useState<{ title: string; alias: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Load available layouts
  useEffect(() => {
    fetchLayouts();
  }, []);

  // Auto-generate alias from title
  useEffect(() => {
    if (formData.title && !formData.alias) {
      const generateUniqueAlias = async () => {
        const baseSlug = pageService.generateSlug(formData.title);
        let uniqueSlug = baseSlug;
        let counter = 1;
        
        // Keep checking until we find an available alias
        while (true) {
          try {
            const isAvailable = await pageService.checkAliasAvailability(uniqueSlug);
            if (isAvailable) {
              setFormData((prev) => ({ ...prev, alias: uniqueSlug }));
              break;
            }
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          } catch (error) {
            // If API fails, just use the base slug
            setFormData((prev) => ({ ...prev, alias: baseSlug }));
            break;
          }
        }
      };
      
      generateUniqueAlias();
    }
  }, [formData.title]);

  const fetchLayouts = async () => {
    try {
      const response = await fetch('/api/layouts');
      const result = await response.json();
      
      if (result.success) {
        setLayouts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching layouts:', error);
    }
  };

  const handleLayoutSelect = async (layoutName: string) => {
    if (!layoutName) {
      setSelectedLayoutName('');
      setLayoutStructure({ rows: [] });
      setCustomCss('');
      setCustomJs('');
      return;
    }

    try {
      const response = await fetch(`/api/layouts/${layoutName}`);
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        setSelectedLayoutName(layoutName);
        setLayoutStructure(typeof data.structure === 'string' ? JSON.parse(data.structure) : data.structure || { rows: [] });
        setCustomCss(data.custom_css || '');
        setCustomJs(data.custom_js || '');
      }
    } catch (error) {
      console.error('Error loading layout:', error);
      alert('Failed to load layout');
    }
  };

  const updateField = (field: keyof PageFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSEO = (seoData: any) => {
    setFormData((prev) => ({ ...prev, seo: seoData }));
  };

  const handleEditorChange = (content: string) => {
    updateField('content', content);
    
    // Calculate word count
    const text = content.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTargetField === 'content') {
      // Insert image into editor
      if (editorRef.current) {
        editorRef.current.insertContent(`<img src="${url}" alt="" />`);
      }
    } else if (mediaTargetField === 'ogImage') {
      updateSEO({ ...formData.seo, ogImage: url });
    } else if (mediaTargetField === 'twitterImage') {
      updateSEO({ ...formData.seo, twitterImage: url });
    }
    setShowMediaBrowser(false);
  };

  const openMediaBrowser = (field: string) => {
    setMediaTargetField(field);
    setShowMediaBrowser(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a page title');
      return;
    }

    if (!formData.alias.trim()) {
      alert('Please enter a page alias');
      return;
    }

    setSaving(true);
    try {
      // Prepare page data
      const pageData = { ...formData };
      
      // If using designer mode, save layout data
      if (contentMode === 'designer') {
        pageData.content = JSON.stringify({
          mode: 'designer',
          layoutName: selectedLayoutName,
          structure: layoutStructure,
          customCss,
          customJs,
        });
      }
      
      const page = await pageService.createPage(pageData);
      setSuccessMessage(`Page "${formData.title}" saved successfully.`);
      setSavedPageData({ title: formData.title, alias: formData.alias });
      
      // Redirect to pages list after successful creation
      setTimeout(() => {
        router.push('/admin/pages');
      }, 1000);
    } catch (error) {
      console.error('Save failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-500">Create A Page</h1>
            <p className="text-sm text-gray-600 mt-1">
              Add a new static page to your site
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Page Title */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Page Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter page title"
              required
            />
          </div>

          {/* Alias */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Alias <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.alias}
              onChange={(e) => updateField('alias', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="page-url-slug"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /page/<span className="text-blue-600">{formData.alias || 'your-alias'}</span>
            </p>
          </div>

          {/* Content Mode Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-3">
              Content Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContentMode('editor')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  contentMode === 'editor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Rich Text Editor
              </button>
              <button
                type="button"
                onClick={() => setContentMode('designer')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  contentMode === 'designer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Layout className="w-4 h-4 inline mr-2" />
                Page Designer
              </button>
            </div>
          </div>

          {/* Content Editor or Designer */}
          {contentMode === 'editor' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-500">
                  Content
                </label>
                <button
                  type="button"
                  onClick={() => openMediaBrowser('content')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <ImageIcon className="w-4 h-4" />
                  Media Browser
                </button>
              </div>
              <Editor
                {...{
                  apiKey: "zvxgyo8w1bgxfurgelu31pu12atqyzvem2o9m21ubt6sz2zq",
                  onInit: (_evt: any, editor: any) => (editorRef.current = editor),
                  value: formData.content,
                  onEditorChange: handleEditorChange,
                  init: {
                    height: 500,
                    menubar: true,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  }
                } as any}
              />
              <p className="text-xs text-gray-500 mt-2">
                Word count: {wordCount}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Select Layout Template
                </label>
                <select
                  value={selectedLayoutName}
                  onChange={(e) => handleLayoutSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Create New Layout</option>
                  {layouts.map((layout) => (
                    <option key={layout.id} value={layout.name}>
                      {layout.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose an existing layout or create a new one from scratch
                </p>
              </div>
              <LayoutBuilder
                structure={layoutStructure}
                onChange={setLayoutStructure}
                customCss={customCss}
                customJs={customJs}
                onCustomCssChange={setCustomCss}
                onCustomJsChange={setCustomJs}
              />
            </div>
          )}

          {/* SEO Section */}
          <SEOSection
            data={formData.seo || {}}
            onChange={updateSEO}
            onOpenMediaBrowser={openMediaBrowser}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Admin note (not visible to public)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Internal description for admin reference
            </p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Public">Public</option>
              <option value="Draft">Draft</option>
              <option value="Private">Private</option>
            </select>
          </div>
        </div>
      </form>

      {/* Media Browser Modal */}
      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
