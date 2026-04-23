'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, Download, Trash2, Edit, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import PDFThumbnail from '@/components/PDFThumbnail';
import SimplePDFViewer from '@/components/SimplePDFViewer';
import ProgressModal from '@/components/admin/ProgressModal';
import { ClientPDFExtractor } from '@/components/admin/ClientPDFExtractor';

interface Page {
  id: number;
  page_number: number;
  image_url: string;
  thumb_url?: string;
  thumb_url_with_cache_bust?: string;
  image_url_with_cache_bust?: string;
  image_url_error?: string;
  file_size: string;
  category: string;
  title?: string;
  alias?: string;
  description?: string;
}

export default function EditionPagesPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params?.id as string;

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedPDF, setUploadedPDF] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());
  const [showDeletePdfConfirm, setShowDeletePdfConfirm] = useState(false);
  
  // Edit page modal state
  const [showEditPageModal, setShowEditPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageFormData, setPageFormData] = useState({
    title: '',
    alias: '',
    description: '',
  });

  // Bulk actions state
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Extract modal state
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractSettings, setExtractSettings] = useState({
    resolution: 300,
    format: 'jpg',
    jpgQuality: 85,
    currentPage: 1,
  });

  // Client-side extraction fallback state
  const [showClientExtractor, setShowClientExtractor] = useState(false);

  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState({
    title: '',
    fileName: '',
    fileSize: '',
    progress: 0,
    status: '',
  });

  useEffect(() => {
    if (editionId) {
      fetchPages();
      fetchEdition();
    }
  }, [editionId]); // Add editionId dependency to prevent stale closures

  const fetchEdition = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const result = await response.json();
      if (result.success && result.data.pdf_url) {
        setPdfUrl(result.data.pdf_url);
      }
    } catch (error) {
      // Handle error silently for better UX
    }
  };

  const fetchPages = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      if (result.success) {
        setPages(result.data || []);
        // Update cache key to force image refresh
        setImageCacheKey(Date.now());
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePdf = async () => {
    if (!pdfUrl) {
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/editions/${editionId}/delete-pdf`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setPdfUrl(null);
        setUploadedPDF(null);
        fetchPages(); // Refresh pages list
      } else {
        alert('Error: ' + (result.error || 'Failed to delete PDF'));
      }
    } catch (error) {
      alert('Failed to delete PDF. Please try again.');
    } finally {
      setLoading(false);
      setShowDeletePdfConfirm(false);
    }
  };

  const reorderPage = async (pageId: number, direction: 'up' | 'down') => {
    // Find the page index
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const newIndex = direction === 'up' ? pageIndex - 1 : pageIndex + 1;
    if (newIndex < 0 || newIndex >= pages.length) return;

    // Optimistic UI update - swap immediately in the UI
    const newPages = [...pages];
    const temp = newPages[pageIndex];
    newPages[pageIndex] = newPages[newIndex];
    newPages[newIndex] = temp;
    
    // Update page numbers in the swapped items
    const tempPageNum = newPages[pageIndex].page_number;
    newPages[pageIndex] = { ...newPages[pageIndex], page_number: newPages[newIndex].page_number };
    newPages[newIndex] = { ...newPages[newIndex], page_number: tempPageNum };
    
    setPages(newPages);

    // Then update the database in the background
    try {
      const response = await fetch(`/api/editions/${editionId}/pages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, direction }),
      });
      const result = await response.json();
      if (!result.success) {
        // If failed, revert the UI change
        fetchPages();
      }
    } catch (error) {
      fetchPages(); // Revert on error
    }
  };

  // Extract pages from PDF using Ghostscript/pdftoppm (server-side), falls back to browser extraction
  const handleExtractPages = async () => {
    if (!pdfUrl) return;

    setProgressData({
      title: 'Extracting Pages',
      fileName: uploadedPDF?.name || 'PDF File',
      fileSize: uploadedPDF ? `${(uploadedPDF.size / (1024 * 1024)).toFixed(2)} MB` : '',
      progress: 0,
      status: 'Preparing extraction...',
    });
    setShowProgressModal(true);
    setShowExtractModal(false);

    try {
      setProgressData(prev => ({ ...prev, progress: 20, status: 'Extracting pages via Ghostscript...' }));

      const response = await fetch(`/api/editions/${editionId}/extract-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: extractSettings.resolution,
          format: extractSettings.format,
          quality: extractSettings.jpgQuality,
        }),
      });

      setProgressData(prev => ({ ...prev, progress: 80, status: 'Saving pages...' }));

      const result = await response.json();

      if (result.success) {
        // Check if server says client-side extraction is needed (e.g. Hostinger fallback)
        if (result.requiresClientSide) {
          setShowProgressModal(false);
          if (!uploadedPDF) {
            alert('Server-side extraction not available. Please re-upload the PDF to use browser-based extraction.');
            return;
          }
          setShowClientExtractor(true);
          return;
        }
        setProgressData(prev => ({ ...prev, progress: 100, status: `Done! ${result.data.pageCount} pages extracted.` }));
        setTimeout(() => {
          setShowProgressModal(false);
          fetchPages();
        }, 800);
      } else {
        // Server-side failed — activate browser fallback if PDF file is available
        setShowProgressModal(false);
        if (uploadedPDF) {
          setShowClientExtractor(true);
        } else {
          alert('Extraction failed: ' + (result.error || 'Unknown error') + '\n\nRe-upload the PDF to use browser-based extraction.');
        }
      }
    } catch (error: any) {
      setShowProgressModal(false);
      // Network/server error — try browser fallback
      if (uploadedPDF) {
        setShowClientExtractor(true);
      } else {
        alert('Extraction failed: ' + error.message + '\n\nRe-upload the PDF to use browser-based extraction.');
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/editions"
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-500">
            dobajedopahar - Pages
          </h1>
        </div>

      </div>

      {/* Breadcrumb */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <Link href="/admin/editions" className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50 transition-colors">
          All Editions »
        </Link>
        <Link href={`/admin/editions/${editionId}/edit`} className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50 transition-colors">
          Edit Edition »
        </Link>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded">
          Upload/Manage Pages »
        </button>
        <button className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50 transition-colors">
          Edit Area Maps »
        </button>
        <Link href={`/epaper/view/${editionId}`} target="_blank" className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50 transition-colors">
          View
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-lg shadow">
        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <label className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Upload JPGs...
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;

                  // Show progress modal
                  setProgressData({
                    title: 'Uploading Images',
                    fileName: `${files.length} files selected`,
                    fileSize: `${(files.reduce((total, file) => total + file.size, 0) / (1024 * 1024)).toFixed(2)} MB total`,
                    progress: 0,
                    status: 'Preparing upload...',
                  });
                  setShowProgressModal(true);

                  try {
                    let uploadedCount = 0;

                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      
                      // Update progress
                      const progress = (i / files.length) * 100;
                      setProgressData(prev => ({ 
                        ...prev, 
                        progress, 
                        status: `Uploading ${file.name} (${i + 1}/${files.length})...` 
                      }));
                      
                      // Create FormData for image upload
                      const formData = new FormData();
                      formData.append('image', file);
                      formData.append('page_number', (pages.length + i + 1).toString());

                      try {
                        const response = await fetch(`/api/editions/${editionId}/pages/upload-image`, {
                          method: 'POST',
                          body: formData,
                        });

                        const result = await response.json();
                        if (result.success) {
                          uploadedCount++;
                        }
                      } catch (uploadError) {
                        // Handle individual file upload errors silently
                      }
                    }

                    // Complete progress
                    setProgressData(prev => ({ 
                      ...prev, 
                      progress: 100, 
                      status: `Upload complete! ${uploadedCount}/${files.length} files uploaded successfully.` 
                    }));

                    setTimeout(() => {
                      setShowProgressModal(false);
                      fetchPages();
                      e.target.value = '';
                    }, 1000);

                  } catch (error) {
                    setShowProgressModal(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
            <label className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Upload PDF...
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Show progress modal
                    setProgressData({
                      title: 'Uploading PDF',
                      fileName: file.name,
                      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                      progress: 0,
                      status: 'Preparing upload...',
                    });
                    setShowProgressModal(true);
                    
                    try {
                      // Simulate progress updates
                      setProgressData(prev => ({ ...prev, progress: 20, status: 'Uploading file...' }));
                      
                      // Direct upload to local storage
                      const { uploadPDFToLocal } = await import('@/lib/upload-helpers');
                      
                      setProgressData(prev => ({ ...prev, progress: 60, status: 'Processing PDF...' }));
                      
                      const result = await uploadPDFToLocal(file, editionId);
                      
                      setProgressData(prev => ({ ...prev, progress: 90, status: 'Finalizing...' }));
                      
                      if (result.success) {
                        setProgressData(prev => ({ ...prev, progress: 100, status: 'Upload complete!' }));
                        
                        setTimeout(() => {
                          setUploadedPDF(file);
                          setPdfUrl(result.url!);
                          setShowProgressModal(false);
                        }, 500);
                      } else {
                        setShowProgressModal(false);
                      }
                    } catch (error) {
                      setShowProgressModal(false);
                    }
                  }
                }}
              />
            </label>
            <button
              onClick={() => {
                if (pdfUrl) {
                  window.open(pdfUrl, '_blank');
                } else {
                  alert('No PDF available to download');
                }
              }}
              disabled={!pdfUrl}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={() => {
                if (!pdfUrl) return;
                setShowDeletePdfConfirm(true);
              }}
              disabled={!pdfUrl}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" /> Delete PDF
            </button>
            <button
              onClick={() => {
                setLoading(true);
                fetchPages();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              🔄 Refresh Pages
            </button>
            <button
              onClick={() => setShowExtractModal(true)}
              disabled={!pdfUrl}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📄 Extract & Optimize Pages
            </button>
          </div>



          <div className="flex items-center gap-2">
            <select 
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="">-- Bulk Actions --</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button 
              onClick={async () => {
                if (!bulkAction) {
                  return;
                }
                
                if (selectedPages.length === 0) {
                  return;
                }

                if (bulkAction === 'delete') {
                  const selectedCount = selectedPages.length;
                  if (!confirm(`Are you sure you want to delete ${selectedCount} page(s)? This action cannot be undone.`)) {
                    return;
                  }
                  try {
                    setLoading(true);
                    const deletePromises = selectedPages.map(pageId => 
                      fetch(`/api/editions/${editionId}/pages/${pageId}`, {
                        method: 'DELETE',
                      })
                    );
                    
                    const results = await Promise.all(deletePromises);
                    const jsonResults = await Promise.all(results.map(r => r.json()));
                    const failed = jsonResults.filter(r => !r.success);
                    
                    if (failed.length > 0) {
                      alert(`Failed to delete ${failed.length} page(s). Please try again.`);
                    }
                    
                    setSelectedPages([]);
                    setBulkAction('');
                    fetchPages();
                  } catch (error) {
                    alert('Failed to delete pages. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              disabled={!bulkAction || selectedPages.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Pages Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectedPages.length === pages.length && pages.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPages(pages.map(p => p.id));
                      } else {
                        setSelectedPages([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                  Actions
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                  Preview
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                  Page Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                  Page Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                  File Size
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading pages...
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No pages yet. Upload a PDF or JPG files to get started.</p>
                  </td>
                </tr>
              ) : (
                pages.map((page, index) => (
                  <tr key={page.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={selectedPages.includes(page.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPages([...selectedPages, page.id]);
                          } else {
                            setSelectedPages(selectedPages.filter(id => id !== page.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/editions/${editionId}/pages/${page.id}/area-maps`}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Create Area Maps
                        </Link>
                        <button
                          onClick={() => {
                            setEditingPage(page);
                            setPageFormData({
                              title: page.title || `Page ${page.page_number}`,
                              alias: page.alias || `page-${page.page_number}`,
                              description: page.description || '',
                            });
                            setShowEditPageModal(true);
                          }}
                          className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"
                          title="Edit Page"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete Page ${page.page_number}? This action cannot be undone.`)) {
                              return;
                            }
                            try {
                              const response = await fetch(`/api/editions/${editionId}/pages/${page.id}`, {
                                method: 'DELETE',
                              });
                              const result = await response.json();
                              if (result.success) {
                                fetchPages();
                              } else {
                                alert('Error: ' + (result.error || 'Failed to delete page'));
                              }
                            } catch (error) {
                              alert('Failed to delete page. Please try again.');
                            }
                          }}
                          className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Delete Page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {page.image_url?.endsWith('.pdf') ? (
                        <PDFThumbnail
                          url={page.image_url}
                          alt={`Page ${page.page_number}`}
                          className="w-16 h-20 border border-gray-200 rounded overflow-hidden"
                        />
                      ) : (
                        <img
                          src={`${page.thumb_url || page.image_url}?v=${imageCacheKey}`}
                          alt={`Page ${page.page_number}`}
                          className="w-16 h-20 object-cover border border-gray-200 rounded"
                          key={`${page.id}-${imageCacheKey}`}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      Page {page.page_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            if (index === 0) return;
                            await reorderPage(page.id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={async () => {
                            if (index === pages.length - 1) return;
                            await reorderPage(page.id, 'down');
                          }}
                          disabled={index === pages.length - 1}
                          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <label className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 cursor-pointer">
                          ⟳ Replace Page
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              try {
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                const response = await fetch(`/api/editions/${editionId}/pages/${page.id}/replace`, {
                                  method: 'POST',
                                  body: formData,
                                });
                                const result = await response.json();
                                if (result.success) {
                                  fetchPages();
                                }
                              } catch (error) {
                                // Handle error silently
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {page.file_size}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extract Pages from PDF Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-500">Extract & Optimize Pages from PDF</h3>
              <button
                onClick={() => setShowExtractModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center border border-gray-300 rounded"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Settings */}
                <div className="space-y-6">
                  {/* Resolution & JPG Quality */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-2">
                        Resolution (DPI)
                      </label>
                      <select
                        value={extractSettings.resolution}
                        onChange={(e) => setExtractSettings({ ...extractSettings, resolution: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="72">72 DPI (Low Quality)</option>
                        <option value="150">150 DPI (Standard)</option>
                        <option value="300">300 DPI (High Quality) ⭐</option>
                        <option value="600">600 DPI (Ultra High Quality)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-2">
                        Format
                      </label>
                      <select
                        value={extractSettings.format}
                        onChange={(e) => setExtractSettings({ ...extractSettings, format: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="jpg">JPG (smaller size) ⭐</option>
                        <option value="png">PNG (lossless)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-2">
                      JPG Quality: {extractSettings.jpgQuality}%
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={extractSettings.jpgQuality}
                      onChange={(e) => setExtractSettings({ ...extractSettings, jpgQuality: Number(e.target.value) })}
                      className="w-full"
                      disabled={extractSettings.format === 'png'}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>20% (smaller)</span>
                      <span>100% (best quality)</span>
                    </div>
                  </div>

                  {/* Extract & Optimize Button */}
                  <button
                    onClick={handleExtractPages}
                    disabled={!pdfUrl || loading}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '🔄 Processing...' : '📄 Extract & Optimize Pages'}
                  </button>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500">Page:</span>
                      <input
                        type="number"
                        value={extractSettings.currentPage}
                        onChange={(e) => setExtractSettings({ ...extractSettings, currentPage: Number(e.target.value) })}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                        min="1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500">Zoom:</span>
                      <button
                        onClick={() => setPdfZoom(Math.max(50, pdfZoom - 10))}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium w-12 text-center">{pdfZoom}%</span>
                      <button
                        onClick={() => setPdfZoom(Math.min(200, pdfZoom + 10))}
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setPdfZoom(100)}
                        className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* PDF Preview */}
                  <div 
                    className="border-2 border-gray-300 rounded bg-gray-50 h-[600px] overflow-auto relative"
                    onWheel={(e) => {
                      // Check if it's a pinch gesture (Ctrl key is auto-added by browser for pinch)
                      if (e.ctrlKey) {
                        e.preventDefault();
                        // Scroll up (negative deltaY) = zoom in
                        // Scroll down (positive deltaY) = zoom out
                        const delta = e.deltaY > 0 ? -5 : 5;
                        setPdfZoom(prev => Math.max(50, Math.min(200, prev + delta)));
                      }
                    }}
                    onTouchStart={(e) => {
                      if (e.touches.length === 2) {
                        e.preventDefault();
                        const touch1 = e.touches[0];
                        const touch2 = e.touches[1];
                        const distance = Math.hypot(
                          touch2.clientX - touch1.clientX,
                          touch2.clientY - touch1.clientY
                        );
                        setLastTouchDistance(distance);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length === 2 && lastTouchDistance !== null) {
                        e.preventDefault();
                        const touch1 = e.touches[0];
                        const touch2 = e.touches[1];
                        const distance = Math.hypot(
                          touch2.clientX - touch1.clientX,
                          touch2.clientY - touch1.clientY
                        );
                        const delta = distance - lastTouchDistance;
                        // Fingers moving apart = zoom in, together = zoom out
                        setPdfZoom(prev => Math.max(50, Math.min(200, prev + delta * 0.3)));
                        setLastTouchDistance(distance);
                      }
                    }}
                    onTouchEnd={() => {
                      setLastTouchDistance(null);
                    }}
                    style={{ cursor: pdfUrl ? 'grab' : 'default' }}
                  >
                    {pdfUrl ? (
                      <SimplePDFViewer 
                        pdfUrl={pdfUrl}
                        pageNumber={extractSettings.currentPage}
                        className="w-full h-[550px]"
                      />
                    ) : (
                      <div className="w-full h-[550px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
                        <div className="text-center">
                          <p className="text-4xl mb-2">📄</p>
                          <p className="text-gray-600">Upload a PDF to see preview</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Preview info */}
                    {pdfUrl && (
                      <div className="p-4 text-center border-t border-gray-200 bg-white">
                        <p className="text-sm text-gray-600">
                          PDF Page {extractSettings.currentPage} Preview • Zoom: {pdfZoom}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Use zoom controls above or scroll with Ctrl+wheel
                        </p>
                        {pages.length > 0 && (
                          <p className="text-xs text-green-600 mt-2 font-medium">
                            ✓ {pages.length} page(s) extracted • Click "Refresh Pages" to see extracted images
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Page Modal */}
      {showEditPageModal && editingPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-500">Edit</h2>
              <button
                onClick={() => {
                  setShowEditPageModal(false);
                  setEditingPage(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Page Title */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Page Title
                </label>
                <input
                  type="text"
                  value={pageFormData.title}
                  onChange={(e) => setPageFormData({ ...pageFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Page 1"
                />
              </div>

              {/* Alias */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Alias
                </label>
                <input
                  type="text"
                  value={pageFormData.alias}
                  onChange={(e) => setPageFormData({ ...pageFormData, alias: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="page-1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Description
                </label>
                <textarea
                  value={pageFormData.description}
                  onChange={(e) => setPageFormData({ ...pageFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter page description..."
                />
              </div>

              {/* Page Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Page Preview
                </label>
                <div className="border border-gray-200 rounded p-4 bg-gray-50">
                  {editingPage.thumb_url_with_cache_bust || editingPage.thumb_url || editingPage.image_url ? (
                    <img
                      src={editingPage.thumb_url_with_cache_bust || editingPage.thumb_url || editingPage.image_url}
                      alt={`Page ${editingPage.page_number}`}
                      className="w-32 h-40 object-cover border border-gray-300 rounded mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-40 bg-gray-200 flex items-center justify-center mx-auto rounded">
                      <span className="text-gray-400 text-sm">No Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowEditPageModal(false);
                  setEditingPage(null);
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editingPage) return;
                  
                  try {
                    const response = await fetch(`/api/editions/${editionId}/pages`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        pageId: editingPage.id,
                        title: pageFormData.title,
                        alias: pageFormData.alias,
                        description: pageFormData.description,
                      }),
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                      alert('Page updated successfully!');
                      setShowEditPageModal(false);
                      setEditingPage(null);
                      fetchPages();
                    } else {
                      alert('Error: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Update error:', error);
                    alert('Failed to update page');
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete PDF Confirmation Modal */}
      {showDeletePdfConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700">Delete PDF?</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                This will remove the PDF and all extracted pages for this edition.
                This action cannot be undone.
              </p>
              <p className="text-xs text-red-600">Are you sure you want to continue?</p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDeletePdfConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePdf}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={showProgressModal}
        title={progressData.title}
        fileName={progressData.fileName}
        fileSize={progressData.fileSize}
        progress={progressData.progress}
        status={progressData.status}
        onCancel={() => setShowProgressModal(false)}
        showCancel={progressData.progress < 100}
      />

      {/* Browser-based fallback extraction */}
      {showClientExtractor && uploadedPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700">Browser-Based Extraction</h3>
              <button
                onClick={() => setShowClientExtractor(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-4">
                Server-side extraction unavailable. Extracting pages directly in your browser.
              </p>
              <ClientPDFExtractor
                editionId={parseInt(editionId)}
                pdfFile={uploadedPDF}
                onComplete={(extractedPages) => {
                  setShowClientExtractor(false);
                  fetchPages();
                }}
                onError={(error) => {
                  setShowClientExtractor(false);
                  alert('Browser extraction failed: ' + error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
