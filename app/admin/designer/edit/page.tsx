'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutBuilder } from '@/components/layout-builder/LayoutBuilder';
import { LayoutStructure } from '@/components/layout-builder/types';

type Layout = {
  id: number;
  name: string;
  structure: any;
  status: string;
  created_at: string;
  updated_at: string;
  custom_css: string;
  custom_js: string;
};

function EditLayoutPageContent() {
  const searchParams = useSearchParams();
  const layoutName = searchParams?.get('layout') || null;
  const [layout, setLayout] = useState<Layout | null>(null);
  const [allLayouts, setAllLayouts] = useState<Layout[]>([]);
  const [structure, setStructure] = useState<LayoutStructure>({ rows: [] });
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'designer' | 'backups'>('designer');
  const [previewMode, setPreviewMode] = useState(false);
  const [connectedPages, setConnectedPages] = useState<any[]>([]);
  const [showConnectedPages, setShowConnectedPages] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAllLayouts();
  }, []);

  useEffect(() => {
    if (layoutName) {
      fetchLayout();
      fetchConnectedPages();
    } else {
      setIsLoading(false);
    }
  }, [layoutName]);

  const fetchConnectedPages = async () => {
    if (!layoutName) return;
    
    try {
      const response = await fetch(`/api/layouts/${encodeURIComponent(layoutName)}/pages`);
      const result = await response.json();
      
      if (result.success) {
        setConnectedPages(result.data.pages || []);
      }
    } catch (error) {
      console.error('Failed to fetch connected pages:', error);
    }
  };

  const fetchAllLayouts = async () => {
    try {
      const response = await fetch('/api/layouts');
      const result = await response.json();
      
      if (result.success) {
        setAllLayouts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching all layouts:', error);
    }
  };

  const fetchLayout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/layouts/${layoutName}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        setLayout(data);
        setStructure(typeof data.structure === 'string' ? JSON.parse(data.structure) : data.structure || { rows: [] });
        setCustomCss(data.custom_css || '');
        setCustomJs(data.custom_js || '');
      } else {
        // Create new layout
        const newLayout = {
          name: layoutName,
          structure: { rows: [] },
          custom_css: '',
          custom_js: '',
          status: 'draft' as const,
        };
        setLayout(newLayout as any);
        setStructure({ rows: [] });
      }
    } catch (error) {
      console.error('Error fetching layout:', error);
      alert('Failed to load layout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!layout) {
      console.error('No layout to save');
      return;
    }

    console.log('Starting save with status:', status);
    console.log('Layout name:', layout.name);
    console.log('Structure:', structure);

    try {
      setIsSaving(true);
      
      const layoutToSave = {
        name: layout.name,
        structure,
        custom_css: customCss,
        custom_js: customJs,
        status,
      };

      console.log('Saving layout:', layoutToSave);

      // Use the new API endpoint
      const response = await fetch('/api/layouts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutToSave),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save layout');
      }

      console.log('Save successful:', data);
      await fetchLayout();

      // Signal all LayoutRenderer instances to refetch (clears their sessionStorage)
      if (typeof window !== 'undefined') {
        localStorage.setItem('layout_updated', JSON.stringify({ name: layout.name, ts: Date.now() }));
      }
      
      const message = status === 'published' 
        ? '✅ Layout published! Changes are now live on the website.' 
        : '💾 Layout saved as draft.';
      
      alert(message);
    } catch (error: any) {
      console.error('Error saving layout:', error);
      alert(`Failed to save layout: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto text-center py-8 sm:py-12">
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm">
            <div className="mb-4">📄</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Layout not found</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">The requested layout could not be found.</p>
            <button
              onClick={() => router.push('/admin/designer')}
              className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base"
            >
              Back to Designer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile-friendly header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-600">
            <span className="hidden sm:inline">Edit Layout: </span>
            <span className="sm:hidden">Edit: </span>
            {layout.name}
          </h1>
        </div>

        {/* Connected Pages Panel - Hidden */}
        {false && (
          <div className="bg-white border border-gray-300 rounded-lg p-3 sm:p-4 mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-600">
                Pages Using This Layout: {layout?.name || 'Unknown'}
              </h3>
              <button
                onClick={() => setShowConnectedPages(false)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {connectedPages.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-base sm:text-lg font-medium mb-2">No pages connected yet</p>
                <p className="text-sm">This layout is not being used by any pages</p>
              </div>
            ) : (
              <div className="space-y-2">
                {connectedPages.map((page) => (
                  <div
                    key={page.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors gap-2 sm:gap-0"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-500">{page.title}</h4>
                      <p className="text-sm text-gray-600">/{page.alias}</p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        page.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.status}
                      </span>
                      <button
                        onClick={() => window.open(`/epaper/page/${page.alias}`, '_blank')}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="View Page"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile-responsive container */}
        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
          {/* Mobile-friendly tabs */}
          <div className="flex border-b border-gray-300 overflow-x-auto">
            <button
              onClick={() => setActiveTab('designer')}
              className={`px-4 sm:px-6 py-3 font-medium whitespace-nowrap flex-shrink-0 ${
                activeTab === 'designer'
                  ? 'text-gray-600 border-b-2 border-gray-200'
                  : 'text-gray-600 hover:text-gray-600'
              }`}
            >
              Designer
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`px-4 sm:px-6 py-3 font-medium whitespace-nowrap flex-shrink-0 ${
                activeTab === 'backups'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-blue-500 hover:text-blue-600'
              }`}
            >
              Layout Backups
            </button>
          </div>

          {/* Mobile-responsive action buttons */}
          <div className="p-3 sm:p-4 border-b border-gray-300">
            {/* First row - Main actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => router.push('/admin/designer')}
                  className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600 flex items-center justify-center gap-2 text-sm"
                >
                  ◀ Back
                </button>
                
                <button
                  onClick={() => {
                    console.log('Save as Draft button clicked');
                    handleSave('draft');
                  }}
                  disabled={isSaving}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  <span className="hidden sm:inline">
                    {isSaving ? 'Saving...' : 'Save as Draft'}
                  </span>
                  <span className="sm:hidden">
                    {isSaving ? 'Saving...' : 'Draft'}
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    console.log('Save and Publish button clicked');
                    handleSave('published');
                  }}
                  disabled={isSaving}
                  className="px-3 sm:px-4 py-2 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">
                    {isSaving ? 'Publishing...' : 'Save and Publish'}
                  </span>
                  <span className="sm:hidden">
                    {isSaving ? 'Publishing...' : 'Publish'}
                  </span>
                </button>
                
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 sm:px-4 py-2 rounded font-medium text-sm ${
                    previewMode
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  <span className="hidden sm:inline">
                    {previewMode ? 'Preview Mode On' : 'Preview Mode Off'}
                  </span>
                  <span className="sm:hidden">
                    {previewMode ? 'Preview On' : 'Preview Off'}
                  </span>
                </button>
              </div>

              {/* Layout selector - Full width on mobile */}
              <div className="w-full sm:w-auto">
                <select 
                  className="w-full sm:min-w-[200px] px-3 sm:px-4 py-2 border border-gray-300 rounded bg-white text-sm"
                  value={layout.name}
                  onChange={(e) => {
                    const selectedLayout = e.target.value;
                    router.push(`/admin/designer/edit?layout=${encodeURIComponent(selectedLayout)}`);
                  }}
                >
                  {allLayouts.length > 0 ? (
                    allLayouts.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name}
                      </option>
                    ))
                  ) : (
                    <option value={layout.name}>{layout.name}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Layout Builder - Mobile responsive */}
          <div className="p-3 sm:p-6 bg-gray-50">
            {activeTab === 'designer' ? (
              <div className="w-full overflow-x-auto">
                <LayoutBuilder
                  structure={structure}
                  onChange={setStructure}
                  customCss={customCss}
                  customJs={customJs}
                  onCustomCssChange={setCustomCss}
                  onCustomJsChange={setCustomJs}
                />
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <div className="mb-2">📱</div>
                <p className="text-sm sm:text-base">Layout backups will be displayed here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditLayoutPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <EditLayoutPageContent />
    </Suspense>
  );
}
