'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SEOData {
  customTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  headerCode?: string;
  footerCode?: string;
}

interface SEOSectionProps {
  data: SEOData;
  onChange: (data: SEOData) => void;
  onOpenMediaBrowser: (field: string) => void;
}

type TabType = 'basic' | 'opengraph' | 'twitter' | 'codes' | 'variables';

export default function SEOSection({ data, onChange, onOpenMediaBrowser }: SEOSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const updateField = (field: keyof SEOData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: 'Basic' },
    { id: 'opengraph', label: 'Open Graph' },
    { id: 'twitter', label: 'Twitter' },
    { id: 'codes', label: 'Header/Footer Codes' },
    { id: 'variables', label: 'Variables' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-purple-600 text-white hover:bg-purple-700 transition-colors"
      >
        <h2 className="text-lg font-semibold">Search Engine Optimization</h2>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Title
                  </label>
                  <input
                    type="text"
                    value={data.customTitle || ''}
                    onChange={(e) => updateField('customTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Override page title for SEO"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use page title
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={data.metaDescription || ''}
                    onChange={(e) => updateField('metaDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description for search engines (150-160 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {data.metaDescription?.length || 0} / 160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    value={data.metaKeywords || ''}
                    onChange={(e) => updateField('metaKeywords', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated keywords
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Robots
                  </label>
                  <select
                    value={data.robots || 'index, follow'}
                    onChange={(e) => updateField('robots', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="index, follow">Index, Follow</option>
                    <option value="noindex, follow">No Index, Follow</option>
                    <option value="index, nofollow">Index, No Follow</option>
                    <option value="noindex, nofollow">No Index, No Follow</option>
                  </select>
                </div>
              </>
            )}

            {/* Open Graph Tab */}
            {activeTab === 'opengraph' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OG Title
                  </label>
                  <input
                    type="text"
                    value={data.ogTitle || ''}
                    onChange={(e) => updateField('ogTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Title for social media sharing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OG Description
                  </label>
                  <textarea
                    value={data.ogDescription || ''}
                    onChange={(e) => updateField('ogDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Description for social media sharing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OG Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={data.ogImage || ''}
                      onChange={(e) => updateField('ogImage', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenMediaBrowser('ogImage')}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Browse
                    </button>
                  </div>
                  {data.ogImage && (
                    <img
                      src={data.ogImage}
                      alt="OG Preview"
                      className="mt-2 w-full max-w-md h-48 object-cover rounded border"
                    />
                  )}
                </div>
              </>
            )}

            {/* Twitter Tab */}
            {activeTab === 'twitter' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Card Type
                  </label>
                  <select
                    value={data.twitterCard || 'summary_large_image'}
                    onChange={(e) => updateField('twitterCard', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Title
                  </label>
                  <input
                    type="text"
                    value={data.twitterTitle || ''}
                    onChange={(e) => updateField('twitterTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Title for Twitter cards"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Description
                  </label>
                  <textarea
                    value={data.twitterDescription || ''}
                    onChange={(e) => updateField('twitterDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Description for Twitter cards"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={data.twitterImage || ''}
                      onChange={(e) => updateField('twitterImage', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenMediaBrowser('twitterImage')}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Browse
                    </button>
                  </div>
                  {data.twitterImage && (
                    <img
                      src={data.twitterImage}
                      alt="Twitter Preview"
                      className="mt-2 w-full max-w-md h-48 object-cover rounded border"
                    />
                  )}
                </div>
              </>
            )}

            {/* Header/Footer Codes Tab */}
            {activeTab === 'codes' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Code
                  </label>
                  <textarea
                    value={data.headerCode || ''}
                    onChange={(e) => updateField('headerCode', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="<script>...</script> or <style>...</style>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Code injected in the &lt;head&gt; section
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer Code
                  </label>
                  <textarea
                    value={data.footerCode || ''}
                    onChange={(e) => updateField('footerCode', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="<script>...</script>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Code injected before &lt;/body&gt; tag
                  </p>
                </div>
              </>
            )}

            {/* Variables Tab */}
            {activeTab === 'variables' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Use these variables in your content:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <code className="text-purple-600">{'{{site_name}}'}</code>
                    <span className="text-gray-600">Site Name</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-purple-600">{'{{site_url}}'}</code>
                    <span className="text-gray-600">Site URL</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-purple-600">{'{{current_year}}'}</code>
                    <span className="text-gray-600">Current Year</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-purple-600">{'{{page_title}}'}</code>
                    <span className="text-gray-600">Page Title</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-purple-600">{'{{page_url}}'}</code>
                    <span className="text-gray-600">Page URL</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Variables are automatically replaced when the page is rendered.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
