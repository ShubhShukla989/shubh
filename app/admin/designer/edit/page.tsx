'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { LayoutBuilder } from '@/components/layout-builder/LayoutBuilder';
import { LayoutStructure } from '@/components/layout-builder/types';

type Layout = Database['public']['Tables']['layouts']['Row'];

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
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchAllLayouts();
  }, []);

  useEffect(() => {
    if (layoutName) {
      fetchLayout();
    } else {
      setIsLoading(false);
    }
  }, [layoutName]);

  const fetchAllLayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('layouts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setAllLayouts(data || []);
    } catch (error) {
      console.error('Error fetching all layouts:', error);
    }
  };

  const fetchLayout = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('layouts')
        .select('*')
        .eq('name', layoutName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setLayout(data);
        setStructure(data.structure || { rows: [] });
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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Layout not found</h2>
          <p className="text-gray-600 mb-6">The requested layout could not be found.</p>
          <button
            onClick={() => router.push('/admin/designer')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Designer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">
          Edit Layout: {layout.name}
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-t-lg border border-gray-300">
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setActiveTab('designer')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'designer'
                  ? 'text-gray-800 border-b-2 border-gray-800'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Designer
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'backups'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-blue-500 hover:text-blue-600'
              }`}
            >
              Layout Backups
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex items-center justify-between border-b border-gray-300">
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/designer')}
                className="px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600 flex items-center gap-2"
              >
                ◀ Back
              </button>
              <button
                onClick={() => {
                  console.log('Save as Draft button clicked');
                  handleSave('draft');
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => {
                  console.log('Save and Publish button clicked');
                  handleSave('published');
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-cyan-500 text-white rounded font-medium hover:bg-cyan-600 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {isSaving ? 'Publishing...' : 'Save and Publish'}
              </button>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 rounded font-medium ${
                  previewMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                {previewMode ? 'Preview Mode On' : 'Preview Mode Off'}
              </button>
            </div>

            <select 
              className="px-4 py-2 border border-gray-300 rounded bg-white min-w-[200px]"
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

          {/* Layout Builder */}
          <div className="p-6 bg-gray-50">
            {activeTab === 'designer' ? (
              <LayoutBuilder
                structure={structure}
                onChange={setStructure}
                customCss={customCss}
                customJs={customJs}
                onCustomCssChange={setCustomCss}
                onCustomJsChange={setCustomJs}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Layout backups will be displayed here</p>
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
