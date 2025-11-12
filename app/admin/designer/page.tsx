'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';

type Layout = Database['public']['Tables']['layouts']['Row'];

export default function PageDesignerManager() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'designer' | 'backups'>('designer');
  const [previewMode, setPreviewMode] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('layouts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setLayouts(data || []);
    } catch (error) {
      console.error('Error fetching layouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCurrentLayout = async () => {
    try {
      setIsBackingUp(true);
      
      // Backup all layouts
      const backupData = layouts.map(layout => ({
        layout_name: layout.name,
        structure: layout.structure,
      }));

      const { error } = await supabase
        .from('layout_backups')
        .insert(backupData);

      if (error) throw error;

      alert('All layouts backed up online successfully!');
    } catch (error) {
      console.error('Error backing up layouts:', error);
      alert('Failed to backup layouts');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadOfflineBackup = () => {
    const dataStr = JSON.stringify(layouts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `layouts-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const handleUploadOfflineBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate and restore layouts
        if (Array.isArray(data)) {
          const { error } = await supabase
            .from('layouts')
            .upsert(data);

          if (error) throw error;
          
          await fetchLayouts();
          alert('Layouts restored successfully!');
        } else {
          alert('Invalid backup file format');
        }
      } catch (error) {
        console.error('Error restoring backup:', error);
        alert('Failed to restore backup');
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Page Designer Manager</h1>

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
          <div className="p-4 flex gap-3 border-b border-gray-300">
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
            <button
              onClick={handleBackupCurrentLayout}
              disabled={isBackingUp}
              className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
              </svg>
              {isBackingUp ? 'Backing Up...' : 'Backup Current Layout Online'}
            </button>
            <button
              onClick={handleDownloadOfflineBackup}
              className="px-4 py-2 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Offline Backup
            </button>
            <button
              onClick={handleUploadOfflineBackup}
              className="px-4 py-2 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
              </svg>
              Upload Offline Backup
            </button>
          </div>

          {/* Layouts Table */}
          <div className="bg-white">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Layouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {layouts.length > 0 ? (
                  layouts.map((layout) => (
                    <tr key={layout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-sm font-medium text-teal-700 bg-teal-50 rounded">
                          Published!
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/admin/designer/edit?layout=${encodeURIComponent(layout.name)}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {layout.name}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                      No layouts found. Create your first layout to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
