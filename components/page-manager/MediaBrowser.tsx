'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Search, Grid3x3, List, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
}

interface MediaBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: string;
}

export default function MediaBrowser({ isOpen, onClose, onSelect, accept = 'image/*' }: MediaBrowserProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load existing files when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media');
      if (response.ok) {
        const result = await response.json();
        setFiles(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    
    if (!uploadedFiles) {
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(uploadedFiles).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      const newFiles = result.data || [];
      setFiles((prev) => [...newFiles, ...prev]);
      
      // Auto-select the first uploaded file
      if (newFiles.length > 0) {
        setSelectedFile(newFiles[0].url);
        
        // Show success message
        const fileName = newFiles[0].name;
        alert(`✅ File "${fileName}" uploaded and selected successfully!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
    }
  };

  const handleDelete = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeleting(fileId);
    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (selectedFile === files.find(f => f.id === fileId)?.url) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Media Browser</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-200'
              )}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-200'
              )}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
            <input
              type="file"
              multiple
              accept={accept}
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading files...
            </div>
          )}

          {uploading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              Uploading...
            </div>
          )}

          {!loading && !uploading && filteredFiles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No media files</p>
              <p className="text-sm">Upload images to get started</p>
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <button
                    onClick={() => setSelectedFile(file.url)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg w-full',
                      selectedFile === file.url
                        ? 'border-purple-600 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300'
                    )}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedFile === file.url && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDelete(file.id, e)}
                    disabled={deleting === file.id}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === file.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <button
                    onClick={() => setSelectedFile(file.url)}
                    className={cn(
                      'w-full flex items-center gap-4 p-3 rounded-lg border transition-all hover:shadow-md',
                      selectedFile === file.url
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    )}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(file.id, e)}
                      disabled={deleting === file.id}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deleting === file.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedFile ? '1 file selected' : 'No file selected'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedFile}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
