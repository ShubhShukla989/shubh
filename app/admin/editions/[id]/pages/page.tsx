'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, Download, Trash2, Edit, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import PDFThumbnail from '@/components/PDFThumbnail';

interface Page {
  id: number;
  page_number: number;
  image_url: string;
  file_size: string;
  category: string;
}

export default function EditionPagesPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params?.id as string;

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [uploadedPDF, setUploadedPDF] = useState<File | null>(null);
  const [extractSettings, setExtractSettings] = useState({
    resolution: 150,
    jpgQuality: 80,
    useAlternateEngine: false,
    startPage: 1,
    endPage: 1,
    extractAll: true,
    currentPage: 1,
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  useEffect(() => {
    if (editionId) {
      fetchPages();
      fetchEdition();
    }
  }, []); // Only run once on mount

  const fetchEdition = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}`);
      const result = await response.json();
      if (result.success && result.data.pdf_url) {
        setPdfUrl(result.data.pdf_url);
      }
    } catch (error) {
      console.error('Failed to fetch edition:', error);
    }
  };

  const fetchPages = async () => {
    try {
      // Fetch pages for this edition
      console.log('Fetching pages for edition:', editionId);
      const response = await fetch(`/api/editions/${editionId}/pages`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const result = await response.json();
      console.log('Pages API response:', result);
      if (result.success) {
        console.log('Setting pages:', result.data);
        setPages(result.data || []);
      } else {
        console.error('API returned error:', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
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
        alert('Failed to reorder page: ' + result.error);
        fetchPages();
      }
    } catch (error) {
      console.error('Reorder error:', error);
      alert('Failed to reorder page');
      fetchPages(); // Revert on error
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
          <h1 className="text-2xl font-bold text-gray-900">
            dobajedopahar - Pages
          </h1>
        </div>

      </div>

      {/* Breadcrumb */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <Link href="/admin/editions" className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50 transition-colors">
          All Editions »
        </Link>
        <button className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50 transition-colors">
          Edit Edition »
        </button>
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
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4" /> Upload JPGs...
            </button>
            <label className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Upload PDF...
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLoading(true);
                    try {
                      const formData = new FormData();
                      formData.append('pdf', file);

                      const response = await fetch(`/api/editions/${editionId}/upload-pdf`, {
                        method: 'POST',
                        body: formData,
                      });

                      const result = await response.json();
                      if (result.success) {
                        setUploadedPDF(file);
                        setPdfUrl(result.data.pdf_url);
                        alert('PDF uploaded successfully!');
                      } else {
                        alert('Error: ' + result.error);
                      }
                    } catch (error) {
                      console.error('Upload error:', error);
                      alert('Failed to upload PDF');
                    } finally {
                      setLoading(false);
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
              onClick={async () => {
                if (!pdfUrl) {
                  alert('No PDF to delete');
                  return;
                }
                if (!confirm('Are you sure you want to delete this PDF? This action cannot be undone.')) {
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
                    alert('PDF deleted successfully!');
                  } else {
                    alert('Error: ' + result.error);
                  }
                } catch (error) {
                  console.error('Delete error:', error);
                  alert('Failed to delete PDF');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!pdfUrl}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" /> Delete PDF
            </button>
            <button
              onClick={() => {
                if (pdfUrl) {
                  setShowExtractModal(true);
                } else {
                  alert('Please upload a PDF first');
                }
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2 text-sm"
            >
              🔄 Extract Pages
            </button>
            <button
              onClick={() => {
                setLoading(true);
                fetchPages();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2 text-sm"
            >
              🔄 Refresh Pages
            </button>
          </div>

          {pdfUrl && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <p className="text-green-700 text-sm">
                ✓ PDF is ready for extraction
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select className="px-3 py-2 border border-gray-300 rounded text-sm">
              <option>-- Bulk Actions --</option>
              <option>Delete Selected</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
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
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Preview
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Page Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Page Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
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
                      <input type="checkbox" className="rounded border-gray-300" />
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
                          onClick={() => alert('Edit page functionality coming soon')}
                          className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"
                          title="Edit Page"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete Page ${page.page_number}?`)) return;
                            try {
                              const response = await fetch(`/api/editions/${editionId}/pages/${page.id}`, {
                                method: 'DELETE',
                              });
                              const result = await response.json();
                              if (result.success) {
                                alert('Page deleted successfully');
                                fetchPages();
                              } else {
                                alert('Error: ' + result.error);
                              }
                            } catch (error) {
                              console.error('Delete error:', error);
                              alert('Failed to delete page');
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
                          src={page.image_url}
                          alt={`Page ${page.page_number}`}
                          className="w-16 h-20 object-cover border border-gray-200 rounded"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="80"><rect width="64" height="80" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10">No Image</text></svg>';
                          }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
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
                              if (!confirm(`Replace Page ${page.page_number} with ${file.name}?`)) return;
                              
                              try {
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                const response = await fetch(`/api/editions/${editionId}/pages/${page.id}/replace`, {
                                  method: 'POST',
                                  body: formData,
                                });
                                const result = await response.json();
                                if (result.success) {
                                  alert('Page replaced successfully');
                                  fetchPages();
                                } else {
                                  alert('Error: ' + result.error);
                                }
                              } catch (error) {
                                console.error('Replace error:', error);
                                alert('Failed to replace page');
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
              <h3 className="text-xl font-bold text-gray-900">Extract Pages from PDF</h3>
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
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Resolution
                      </label>
                      <select
                        value={extractSettings.resolution}
                        onChange={(e) => setExtractSettings({ ...extractSettings, resolution: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="72">72</option>
                        <option value="150">150</option>
                        <option value="300">300</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Image Quality
                      </label>
                      <input
                        type="number"
                        value={extractSettings.jpgQuality}
                        onChange={(e) => setExtractSettings({ ...extractSettings, jpgQuality: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="100"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Currently saves as PNG (lossless)</p>
                    </div>
                  </div>

                  {/* Preview Button - Updates the page view on the right */}
                  <button
                    onClick={() => {
                      if (!pdfUrl) {
                        alert('No PDF uploaded yet');
                        return;
                      }
                      // The preview is already showing on the right side
                      // This button just confirms the settings are applied
                      alert(`Preview settings applied:\n- Resolution: ${extractSettings.resolution} DPI\n- Page: ${extractSettings.currentPage}\n- Zoom: ${pdfZoom}%`);
                    }}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    disabled={!pdfUrl}
                  >
                    Preview Settings
                  </button>

                  {/* Alternate Engine Checkbox */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={extractSettings.useAlternateEngine}
                      onChange={(e) => setExtractSettings({ ...extractSettings, useAlternateEngine: e.target.checked })}
                      className="rounded border-gray-300"
                      disabled
                    />
                    <span className="text-sm text-gray-500">Use Alternate Engine for PDF to JPG Conversion (Coming Soon)</span>
                  </label>

                  {/* Start & End Page */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Start Page
                      </label>
                      <input
                        type="number"
                        value={extractSettings.startPage}
                        onChange={(e) => setExtractSettings({ ...extractSettings, startPage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        End Page
                      </label>
                      <input
                        type="number"
                        value={extractSettings.endPage}
                        onChange={(e) => setExtractSettings({ ...extractSettings, endPage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Extract All Pages Checkbox */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={extractSettings.extractAll}
                      onChange={(e) => setExtractSettings({ ...extractSettings, extractAll: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-900">Extract All Pages (Maximum 30 Pages)</span>
                  </label>

                  {/* Extract Button */}
                  <button
                    onClick={async () => {
                      if (!pdfUrl) {
                        alert('Please upload a PDF first');
                        return;
                      }
                      
                      const confirmMsg = extractSettings.extractAll 
                        ? 'Extract all pages from the PDF?' 
                        : `Extract pages ${extractSettings.startPage} to ${extractSettings.endPage}?`;
                      
                      if (!confirm(confirmMsg)) {
                        return;
                      }

                      try {
                        setLoading(true);
                        const response = await fetch(`/api/editions/${editionId}/extract-pages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            resolution: extractSettings.resolution,
                            startPage: extractSettings.startPage,
                            endPage: extractSettings.endPage,
                            extractAll: extractSettings.extractAll,
                          }),
                        });
                        const result = await response.json();
                        
                        if (result.success) {
                          alert(`Success! Extracted ${result.data.extractedPages} pages out of ${result.data.totalPages} total pages.`);
                          setShowExtractModal(false);
                          setLoading(true);
                          await fetchPages();
                          setLoading(false);
                        } else {
                          alert('Error: ' + result.error + '\n\n' + (result.info?.message || ''));
                          console.log('Extraction info:', result.info);
                        }
                      } catch (error) {
                        console.error('Extraction error:', error);
                        alert('Failed to extract pages');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || !pdfUrl}
                    className="w-full px-4 py-3 bg-pink-500 text-white rounded hover:bg-pink-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Extracting...' : 'Extract Pages'}
                  </button>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Page:</span>
                      <input
                        type="number"
                        value={extractSettings.currentPage}
                        onChange={(e) => setExtractSettings({ ...extractSettings, currentPage: Number(e.target.value) })}
                        className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                        min="1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Zoom:</span>
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
                      if (e.touches.length === 2 && lastTouchDistance) {
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
                      <div className="flex flex-col items-center p-4">
                        <div 
                          style={{ 
                            width: `${pdfZoom}%`,
                            transition: 'width 0.2s ease-in-out'
                          }}
                          className="bg-white shadow-lg"
                        >
                          <iframe
                            src={`${pdfUrl}#page=${extractSettings.currentPage}`}
                            className="w-full h-[550px] border-0"
                            title="PDF Preview"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-4 text-center">
                          Page {extractSettings.currentPage} Preview
                          <span className="text-xs text-gray-500 block mt-1">
                            Two-finger scroll/pinch to zoom
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 flex items-center justify-center h-full">
                        <div>
                          <p className="text-4xl mb-2">📄</p>
                          <p>Upload a PDF to see preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
