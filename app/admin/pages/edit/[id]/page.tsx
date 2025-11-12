'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { pageService, PageFormData } from '@/lib/services/pageService';
import { menuService } from '@/lib/services/menuService';
import SEOSection from '@/components/page-manager/SEOSection';
import MediaBrowser from '@/components/page-manager/MediaBrowser';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@tinymce/tinymce-react').then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading editor...</p>
      </div>
    </div>
  ),
});

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = parseInt((params?.id as string) || '0');
  const editorRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [originalAlias, setOriginalAlias] = useState('');
  const [formData, setFormData] = useState<PageFormData>({
    title: '',
    alias: '',
    description: '',
    content: '',
    status: 'Draft',
    seo: {},
  });

  const [wordCount, setWordCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAliasWarning, setShowAliasWarning] = useState(false);

  useEffect(() => {
    loadPage();
  }, [pageId]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const page = await pageService.getPage(pageId);
      
      setOriginalAlias(page.alias);
      setFormData({
        title: page.title,
        alias: page.alias,
        description: page.description || '',
        content: page.content || '',
        status: page.status,
        seo: {
          customTitle: page.meta_title || '',
          metaDescription: page.meta_description || '',
          metaKeywords: page.meta_keywords || '',
          robots: 'index, follow',
          ogTitle: page.meta_title || '',
          ogDescription: page.meta_description || '',
          ogImage: page.og_image || '',
          twitterCard: 'summary_large_image',
          twitterTitle: page.twitter_title || '',
          twitterDescription: page.twitter_description || '',
          twitterImage: page.twitter_image || '',
          headerCode: page.header_code || '',
          footerCode: page.footer_code || '',
        },
      });

      // Calculate initial word count
      if (page.content) {
        const text = page.content.replace(/<[^>]*>/g, '').trim();
        const words = text.split(/\s+/).filter((word) => word.length > 0);
        setWordCount(words.length);
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      alert('Failed to load page');
      router.push('/admin/pages');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof PageFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Check if alias changed
    if (field === 'alias' && value !== originalAlias) {
      setShowAliasWarning(true);
    } else if (field === 'alias' && value === originalAlias) {
      setShowAliasWarning(false);
    }
  };

  const updateSEO = (seoData: any) => {
    setFormData((prev) => ({ ...prev, seo: seoData }));
  };

  const handleEditorChange = (content: string) => {
    updateField('content', content);
    
    const text = content.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTargetField === 'content') {
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

    // If alias changed, update menu items
    if (formData.alias !== originalAlias) {
      const confirmUpdate = window.confirm(
        `The page alias has changed from "${originalAlias}" to "${formData.alias}". ` +
        `Do you want to update all menu items that link to this page?`
      );
      
      if (confirmUpdate) {
        try {
          await menuService.updateMenuItemsAlias(originalAlias, formData.alias);
        } catch (error) {
          console.error('Failed to update menu items:', error);
        }
      }
    }

    setSaving(true);
    try {
      await pageService.updatePage(pageId, formData);
      setSuccessMessage(`Page "${formData.title}" saved successfully.`);
      setOriginalAlias(formData.alias);
      setShowAliasWarning(false);
      
      setTimeout(() => {
        router.push('/admin/pages');
      }, 1500);
    } catch (error) {
      console.error('Save failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Page</h1>
            <p className="text-sm text-gray-600 mt-1">
              Update page content and settings
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Alias Warning */}
      {showAliasWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Alias Changed</p>
            <p className="text-amber-700 text-sm mt-1">
              Changing the alias will affect the page URL. You'll be prompted to update menu items when you save.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Page Title */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter page title"
              required
            />
          </div>

          {/* Alias */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alias <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.alias}
              onChange={(e) => updateField('alias', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder="page-url-slug"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /page/<span className="text-purple-600">{formData.alias || 'your-alias'}</span>
            </p>
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <button
                type="button"
                onClick={() => openMediaBrowser('content')}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <ImageIcon className="w-4 h-4" />
                Media Browser
              </button>
            </div>
            <Editor
              apiKey="zvxgyo8w1bgxfurgelu31pu12atqyzvem2o9m21ubt6sz2zq"
              onInit={(_evt: any, editor: any) => (editorRef.current = editor)}
              value={formData.content}
              onEditorChange={handleEditorChange}
              init={{
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
              }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Word count: {wordCount}
            </p>
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Admin note (not visible to public)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Internal description for admin reference
            </p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
