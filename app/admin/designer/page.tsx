'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function PageDesignerManager() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'designer' | 'backups'>('designer');
  const [previewMode, setPreviewMode] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/layouts');
      const result = await response.json();
      
      if (result.success) {
        setLayouts(result.data || []);
      }
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

      const response = await fetch('/api/layouts/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backups: backupData }),
      });

      if (!response.ok) throw new Error('Backup failed');

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
          const response = await fetch('/api/layouts/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layouts: data }),
          });

          if (!response.ok) throw new Error('Restore failed');
          
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
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile-friendly header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-600">
            Page Designer Manager
          </h1>
        </div>

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
            {/* Preview Mode Button - Always visible */}
            <div className="mb-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`w-full sm:w-auto px-4 py-2 rounded font-medium text-sm ${
                  previewMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                {previewMode ? 'Preview Mode On' : 'Preview Mode Off'}
              </button>
            </div>

            {/* Backup buttons - Stack on mobile, inline on larger screens */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleBackupCurrentLayout}
                disabled={isBackingUp}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                </svg>
                <span className="hidden sm:inline">
                  {isBackingUp ? 'Backing Up...' : 'Backup Current Layout Online'}
                </span>
                <span className="sm:hidden">
                  {isBackingUp ? 'Backing Up...' : 'Backup Online'}
                </span>
              </button>
              
              <button
                onClick={handleDownloadOfflineBackup}
                className="px-3 sm:px-4 py-2 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Download Offline Backup</span>
                <span className="sm:hidden">Download Backup</span>
              </button>
              
              <button
                onClick={handleUploadOfflineBackup}
                className="px-3 sm:px-4 py-2 bg-teal-600 text-white rounded font-medium hover:bg-teal-700 flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                </svg>
                <span className="hidden sm:inline">Upload Offline Backup</span>
                <span className="sm:hidden">Upload Backup</span>
              </button>
            </div>
          </div>

          {/* Mobile-responsive layouts display */}
          <div className="bg-white">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Actions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Layouts</th>
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

            {/* Mobile Card View */}
            <div className="md:hidden">
              {layouts.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {layouts.map((layout) => (
                    <div key={layout.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium text-teal-700 bg-teal-50 rounded">
                          Published!
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/designer/edit?layout=${encodeURIComponent(layout.name)}`)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left w-full"
                      >
                        {layout.name}
                      </button>
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {new Date(layout.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <div className="mb-2">📱</div>
                  <div className="text-sm">No layouts found.</div>
                  <div className="text-xs mt-1">Create your first layout to get started.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
