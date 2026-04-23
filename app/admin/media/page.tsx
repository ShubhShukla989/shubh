'use client';

import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Search, Grid3x3, List, Trash2, X } from 'lucide-react';

interface MediaFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media', { cache: 'no-store' });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    
    if (!uploadedFiles) return;

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
      
      alert(`✅ ${newFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeleting(fileId);
    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
      alert('✅ File deleted successfully!');
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Media Library</h1>
        <p className="text-gray-600">Upload and manage your images and files</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Upload Button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchQuery ? 'No files found' : 'No files uploaded yet'}
            </p>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Upload your first file to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`relative group rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                  selectedFile?.id === file.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.id);
                  }}
                  disabled={deleting === file.id}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedFile?.id === file.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.id);
                  }}
                  disabled={deleting === file.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected File Details */}
      {selectedFile && (
        <div className="fixed bottom-0 right-0 w-96 bg-white border-l border-t border-gray-200 shadow-lg p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">File Details</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(selectedFile.id)}
                disabled={deleting === selectedFile.id}
                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {selectedFile.type.startsWith('image/') && (
              <img
                src={selectedFile.url}
                alt={selectedFile.name}
                className="w-full rounded-lg border border-gray-200"
              />
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700">File Name</label>
              <p className="mt-1 text-sm text-gray-900 break-all">{selectedFile.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">File Size</label>
              <p className="mt-1 text-sm text-gray-900">{formatFileSize(selectedFile.size)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">File Type</label>
              <p className="mt-1 text-sm text-gray-900">{selectedFile.type}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">URL</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={selectedFile.url}
                  readOnly
                  className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFile.url);
                    alert('✅ URL copied to clipboard!');
                  }}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Uploaded</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(selectedFile.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
