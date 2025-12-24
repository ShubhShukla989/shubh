'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Tag, Search, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface MediaFile {
  id: string | number;
  url: string;
  name: string;
  title?: string;
  alt_text?: string;
  size: number;
  type: string;
  createdAt: string;
  tags?: string[];
}

interface MediaTag {
  id: number;
  name: string;
  slug: string;
}

export default function MediaManagerPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchBy, setSearchBy] = useState('title');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showTagsSection, setShowTagsSection] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
    fetchTags();
  }, []);

  const fetchMedia = async (search?: { searchBy?: string; query?: string }) => {
    try {
      let url = '/api/media';
      if (search?.query) {
        url += `?searchBy=${search.searchBy || 'title'}&query=${encodeURIComponent(search.query)}`;
      }
      
      console.log('🔍 Fetching media from:', url);
      const response = await fetch(url);
      const result = await response.json();
      console.log('📦 Fetch media result:', result);
      console.log('📁 Media files count:', result.data?.length || 0);
      if (result.data?.length > 0) {
        console.log('📄 First file:', result.data[0]);
      }
      
      if (result.success) {
        console.log('Setting media files:', result.data);
        setMediaFiles(result.data || []);
      } else {
        console.error('Fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/media/tags');
      const result = await response.json();
      if (result.success) {
        setTags(result.data || []);
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      return [];
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      console.log('Upload response:', result);

      if (result.success) {
        alert(`${result.data.length} file(s) uploaded successfully!`);
        await fetchMedia(); // Wait for fetch to complete
      } else {
        const errorMsg = result.details 
          ? `Upload failed: ${result.error}\n\nDetails: ${result.details}`
          : `Upload failed: ${result.error}`;
        alert(errorMsg);
        console.error('Upload error details:', result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMedia = async (fileId: string | number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Media deleted successfully!');
        fetchMedia();
      } else {
        alert('Failed to delete media: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete media');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/media/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Tag created successfully!');
        setNewTagName('');
        fetchTags();
      } else {
        alert('Failed to create tag: ' + result.error);
      }
    } catch (error) {
      console.error('Create tag error:', error);
      alert('Failed to create tag');
    }
  };

  const handleDeleteTag = async (id: number, name: string) => {
    if (!confirm(`Delete tag "${name}"?`)) return;

    try {
      const response = await fetch(`/api/media/tags?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        alert('Tag deleted successfully!');
        fetchTags();
      } else {
        alert('Failed to delete tag');
      }
    } catch (error) {
      console.error('Delete tag error:', error);
      alert('Failed to delete tag');
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchMedia({ searchBy, query: searchQuery });
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchBy('title');
    setLoading(true);
    fetchMedia();
  };

  const handleMediaClick = async (file: MediaFile) => {
    setSelectedMedia(file);
    setEditTitle(file.title || file.name);
    setEditCaption(file.alt_text || '');
    
    // Refresh tags list to get any newly created tags
    const latestTags = await fetchTags();
    
    // First, try to use tags from the file object (already loaded from API)
    if (file.tags && file.tags.length > 0) {
      // Find tag IDs from tag names
      const tagIds = latestTags
        .filter((tag: MediaTag) => file.tags?.includes(tag.name))
        .map((tag: MediaTag) => tag.id);
      
      setSelectedTags(tagIds);
      setTagsInput(file.tags.join(', '));
    } else if (file.id) {
      // If no tags in file object, load from API
      try {
        const response = await fetch(`/api/media/${file.id}/tags`);
        const result = await response.json();
        if (result.success) {
          setSelectedTags(result.data || []);
          // Update tags input field using the latest tags
          const tagNames = latestTags
            .filter((tag: MediaTag) => (result.data || []).includes(tag.id))
            .map((tag: MediaTag) => tag.name)
            .join(', ');
          setTagsInput(tagNames);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
        setSelectedTags([]);
        setTagsInput('');
      }
    } else {
      // No tags available
      setSelectedTags([]);
      setTagsInput('');
    }
  };

  const handleCloseSidePanel = () => {
    setSelectedMedia(null);
    setEditTitle('');
    setEditCaption('');
    setSelectedTags([]);
    setTagsInput('');
  };

  const handleSaveMedia = async () => {
    if (!selectedMedia || !selectedMedia.id) return;

    setSaving(true);
    try {
      // Check if this is a numeric ID (database record) or filename (storage only)
      const isNumericId = typeof selectedMedia.id === 'number' || !isNaN(Number(selectedMedia.id));
      
      let mediaId = selectedMedia.id;
      
      if (!isNumericId) {
        // This file is not in the database yet, create a record first
        console.log('Creating database record for file:', selectedMedia.name);
        try {
          const createResponse = await fetch('/api/media/create-record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: selectedMedia.name,
              url: selectedMedia.url,
              size: selectedMedia.size,
              type: selectedMedia.type,
            }),
          });

          const createResult = await createResponse.json();
          console.log('Create record result:', createResult);
          
          if (!createResult.success) {
            alert('Failed to create media record: ' + createResult.error);
            setSaving(false);
            return;
          }
          
          mediaId = createResult.data.id;
          console.log('New media ID:', mediaId);
        } catch (error) {
          console.error('Failed to create media record:', error);
          alert('Failed to create media record. Please check console for details.');
          setSaving(false);
          return;
        }
      }

      // Update media details
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          alt_text: editCaption,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert('Failed to update media: ' + result.error);
        setSaving(false);
        return;
      }

      // Parse tags from input field
      const tagNames = tagsInput
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
      
      // Match existing tags and create new ones
      const matchedTagIds: number[] = [];
      const newTagNames: string[] = [];

      for (const tagName of tagNames) {
        const existingTag = tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());
        if (existingTag) {
          matchedTagIds.push(existingTag.id);
        } else {
          newTagNames.push(tagName);
        }
      }

      // Create new tags if any
      for (const newTagName of newTagNames) {
        try {
          const createResponse = await fetch('/api/media/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newTagName }),
          });

          const createResult = await createResponse.json();
          if (createResult.success && createResult.data) {
            matchedTagIds.push(createResult.data.id);
          }
        } catch (error) {
          console.error(`Failed to create tag "${newTagName}":`, error);
        }
      }

      // Update tags
      console.log('Updating tags for media ID:', mediaId, 'with tag IDs:', matchedTagIds);
      
      const tagsResponse = await fetch(`/api/media/${mediaId}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag_ids: matchedTagIds,
        }),
      });

      const tagsResult = await tagsResponse.json();
      console.log('Tags update result:', tagsResult);

      if (tagsResult.success) {
        // Refresh tags list to include newly created tags
        await fetchTags();
        // Refresh media to show updated tags on cards
        await fetchMedia();
        alert('Media and tags updated successfully!');
        handleCloseSidePanel();
      } else {
        console.error('Tags update failed:', tagsResult);
        alert('Media updated but failed to update tags: ' + tagsResult.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFromPanel = async () => {
    if (!selectedMedia) return;
    
    if (!confirm(`Delete "${selectedMedia.title || selectedMedia.name}"?`)) return;

    try {
      const response = await fetch(`/api/media/${selectedMedia.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Media deleted successfully!');
        handleCloseSidePanel();
        fetchMedia();
      } else {
        alert('Failed to delete media: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete media');
    }
  };

  return (
    <div className="p-6 flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-500">Media Manager</h1>
          {selectedMedia && (
            <button
              onClick={handleDeleteFromPanel}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload...'}
        </button>
        <Link
          href="/admin/media/tags"
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-100 transition-colors"
        >
          <Tag className="w-4 h-4" />
          Manage Media Tags
        </Link>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="title">Search By Title</option>
            <option value="tag">Search By Tag</option>
          </select>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder="Search..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="p-2 bg-gray-200 text-gray-500 rounded hover:bg-gray-300">
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading media...</div>
        ) : mediaFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No media files found. Upload your first image!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mediaFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => handleMediaClick(file)}
                className={`bg-white border-2 rounded-lg overflow-hidden hover:shadow-lg transition-all group relative cursor-pointer ${
                  selectedMedia?.id === file.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                <div className="aspect-square relative bg-gray-100">
                  <Image
                    src={file.url}
                    alt={file.title || file.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    onLoad={() => console.log('✅ Image loaded:', file.url)}
                    onError={(e) => console.error('❌ Image failed to load:', file.url, e)}
                  />
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(file.id, file.title || file.name);
                      }}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, '_blank');
                      }}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      title="View"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate" title={file.title || file.name}>
                    {file.title || file.name}
                  </p>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {file.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-800 px-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Right Side Panel - Media Details */}
      {selectedMedia && (
        <div className="w-80 bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-4 sticky top-6 h-fit">
          {/* Close Button */}
          <button
            onClick={handleCloseSidePanel}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Image Preview */}
          <div className="w-full aspect-square relative bg-gray-100 rounded overflow-hidden mt-6">
            <Image
              src={selectedMedia.url}
              alt={selectedMedia.title || selectedMedia.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Edit Title */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Edit Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter title"
            />
            <p className="text-xs text-gray-500 mt-1">{selectedMedia.name}</p>
          </div>

          {/* Edit Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Edit Caption
            </label>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter caption/alt text"
            />
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-500">
                Tags (Separated By, Comma)
              </label>
              <button
                onClick={() => setShowTagsSection(!showTagsSection)}
                className="text-xs text-blue-600 hover:underline"
              >
                [{showTagsSection ? 'Hide' : 'Show'} Tags]
              </button>
            </div>
            
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Epaper Watermark, Other"
            />

            {/* Collapsible Tags Checkboxes */}
            {showTagsSection && (
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                {tags.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No tags available.{' '}
                    <Link href="/admin/media/tags" className="text-blue-600 hover:underline">
                      Create tags
                    </Link>
                  </p>
                ) : (
                  tags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={(e) => {
                          let newSelectedTags: number[];
                          if (e.target.checked) {
                            newSelectedTags = [...selectedTags, tag.id];
                          } else {
                            newSelectedTags = selectedTags.filter((id) => id !== tag.id);
                          }
                          setSelectedTags(newSelectedTags);
                          
                          // Update tags input field
                          const tagNames = tags
                            .filter((t) => newSelectedTags.includes(t.id))
                            .map((t) => t.name)
                            .join(', ');
                          setTagsInput(tagNames);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveMedia}
            disabled={saving}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : '💾 Save'}
          </button>

          {/* File Info */}
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <p>Size: {(selectedMedia.size / 1024).toFixed(2)} KB</p>
            <p>Type: {selectedMedia.type}</p>
            <p className="break-all">URL: {selectedMedia.url}</p>
          </div>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Manage Media Tags</h2>

            {/* Create New Tag */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Create New Tag
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreateTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Tags List */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Existing Tags
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">{tag.name}</span>
                    <button
                      onClick={() => handleDeleteTag(tag.id, tag.name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowTagModal(false)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
