'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Save as SaveIcon, ChevronRight, Copy, Clipboard } from 'lucide-react';
import Link from 'next/link';
import AreaMapEditModal from './AreaMapEditModal';
import ResizeHandle from '@/components/admin/ResizeHandle';
import ActionIcons from '@/components/ActionIcons';

interface AreaMap {
  id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url: string;
  linked_area_ids?: number[];
  isNew?: boolean;
}

interface AvailableAreaMap {
  id: number;
  page_id: number;
  page_number: number;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function AreaMapsPage() {
  const params = useParams();
  const router = useRouter();
  const editionId = params?.id as string;
  const pageId = params?.pageId as string;

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [areaMaps, setAreaMaps] = useState<AreaMap[]>([]);
  const [imageScale, setImageScale] = useState(1);
  const [availableAreaMaps, setAvailableAreaMaps] = useState<AvailableAreaMap[]>([]);
  const [editingArea, setEditingArea] = useState<AreaMap | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Resize state
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  // const [resizeStart, setResizeStart] = useState<{ x: number; y: number; area: AreaMap } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRectRef = useRef<HTMLDivElement>(null);
  
  // Use refs for drawing state to avoid re-renders
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentRectRef = useRef<AreaMap | null>(null);
  
  // Moving state
  const [movingIndex, setMovingIndex] = useState<number | null>(null);
  const moveStateRef = useRef<{
    index: number | null;
    startX: number;
    startY: number;
    originalArea: AreaMap | null;
  }>({
    index: null,
    startX: 0,
    startY: 0,
    originalArea: null
  });
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  
  // Copy/Paste state
  const [copiedAreaMaps, setCopiedAreaMaps] = useState<AreaMap[]>([]);
  const [showPasteOptions, setShowPasteOptions] = useState(false);
  const [allPages, setAllPages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  useEffect(() => {
    fetchPage();
    fetchAreaMaps();
    fetchAvailableAreaMaps();
    fetchAllPages();
  }, [pageId]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle window resize and container changes to recalculate image scale
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        const img = imageRef.current;
        if (img.naturalWidth > 0) { // Make sure image is loaded
          const newScale = img.clientWidth / img.naturalWidth;
          setImageScale(newScale);
        }
      }
    };

    // Use ResizeObserver for better detection of size changes
    let resizeObserver: ResizeObserver | null = null;
    
    if (containerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        debouncedRecalculateScale();
      });
      resizeObserver.observe(containerRef.current);
    }

    // Fallback to window resize events
    window.addEventListener('resize', debouncedRecalculateScale);
    
    // Also listen for orientation change on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(debouncedRecalculateScale, 200); // Longer delay for orientation change
    });

    // Recalculate when page becomes visible (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(debouncedRecalculateScale, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', debouncedRecalculateScale);
      window.removeEventListener('orientationchange', debouncedRecalculateScale);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear any pending debounced calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Recalculate scale when image loads or changes
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (img.naturalWidth > 0) {
      const newScale = img.clientWidth / img.naturalWidth;
      setImageScale(newScale);
    }
  };

  // Debounced resize handler to prevent too many updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedRecalculateScale = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (imageRef.current && imageRef.current.naturalWidth > 0) {
        const img = imageRef.current;
        const newScale = img.clientWidth / img.naturalWidth;
        setImageScale(newScale);
      }
    }, 50); // 50ms debounce
  };

  const fetchAvailableAreaMaps = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/all-area-maps`);
      const result = await response.json();
      if (result.success) {
        setAvailableAreaMaps(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch available area maps:', error);
    }
  };

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}`);
      const result = await response.json();
      if (result.success) {
        setPage(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch page:', error);
      setLoading(false);
    }
  };

  const fetchAreaMaps = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`);
      const result = await response.json();
      if (result.success) {
        setAreaMaps(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch area maps:', error);
    }
  };

  const handleSaveEditedArea = (updatedArea: AreaMap) => {
    setAreaMaps(areaMaps.map(area => 
      area === editingArea ? updatedArea : area
    ));
    setEditingArea(null);
    setShowEditModal(false);
  };

  // Create a new clip area in the center
  const handleAddClipArea = () => {
    if (!imageRef.current) return;
    
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;
    
    // Create a box in the center (300x200 default size)
    const defaultWidth = 300;
    const defaultHeight = 200;
    
    const x = (imgWidth - defaultWidth) / 2;
    const y = (imgHeight - defaultHeight) / 2;
    
    const newArea: AreaMap = {
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
      title: `Area ${areaMaps.length + 1}`,
      url: '#',
      isNew: false
    };
    
    setAreaMaps([...areaMaps, newArea]);
  };

  // Handle moving an area
  const handleMoveStart = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    const area = areaMaps[index];
    moveStateRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      originalArea: { ...area }
    };
    
    setMovingIndex(index);
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', handleMoveMove);
    document.addEventListener('mouseup', handleMoveEnd);
  };

  const handleMoveMove = (e: MouseEvent) => {
    const state = moveStateRef.current;
    if (state.index === null || !state.originalArea) return;
    
    const deltaX = (e.clientX - state.startX) / imageScale;
    const deltaY = (e.clientY - state.startY) / imageScale;
    
    const area = { ...state.originalArea };
    area.x += deltaX;
    area.y += deltaY;
    
    // Update area
    setAreaMaps(prevMaps => {
      const newMaps = [...prevMaps];
      newMaps[state.index!] = area;
      return newMaps;
    });
  };

  const handleMoveEnd = () => {
    moveStateRef.current = {
      index: null,
      startX: 0,
      startY: 0,
      originalArea: null
    };
    
    setMovingIndex(null);
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleMoveMove);
    document.removeEventListener('mouseup', handleMoveEnd);
  };

  // Resize handlers - Using refs to avoid closure issues
  const resizeStateRef = useRef<{
    index: number | null;
    handle: string | null;
    startX: number;
    startY: number;
    originalArea: AreaMap | null;
  }>({
    index: null,
    handle: null,
    startX: 0,
    startY: 0,
    originalArea: null
  });

  const handleResizeStart = (e: React.MouseEvent, index: number, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🔧 Resize handle clicked:', handle, 'for area', index);
    
    const area = areaMaps[index];
    resizeStateRef.current = {
      index,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      originalArea: { ...area }
    };
    
    setResizingIndex(index);
    setResizeHandle(handle);
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    const state = resizeStateRef.current;
    if (state.index === null || !state.originalArea || !state.handle) return;
    
    console.log('🔄 Resizing...', e.clientX, e.clientY);
    
    const deltaX = (e.clientX - state.startX) / imageScale;
    const deltaY = (e.clientY - state.startY) / imageScale;
    
    const area = { ...state.originalArea };
    const minSize = 50;
    
    // Apply resize based on handle
    switch (state.handle) {
      case 'top-left':
        area.x += deltaX;
        area.y += deltaY;
        area.width -= deltaX;
        area.height -= deltaY;
        break;
      case 'top':
        area.y += deltaY;
        area.height -= deltaY;
        break;
      case 'top-right':
        area.width += deltaX;
        area.y += deltaY;
        area.height -= deltaY;
        break;
      case 'left':
        area.x += deltaX;
        area.width -= deltaX;
        break;
      case 'right':
        area.width += deltaX;
        break;
      case 'bottom-left':
        area.x += deltaX;
        area.width -= deltaX;
        area.height += deltaY;
        break;
      case 'bottom':
        area.height += deltaY;
        break;
      case 'bottom-right':
        area.width += deltaX;
        area.height += deltaY;
        break;
    }
    
    // Enforce minimum size
    if (area.width < minSize) {
      if (state.handle.includes('left')) {
        area.x = state.originalArea.x + state.originalArea.width - minSize;
      }
      area.width = minSize;
    }
    if (area.height < minSize) {
      if (state.handle.includes('top')) {
        area.y = state.originalArea.y + state.originalArea.height - minSize;
      }
      area.height = minSize;
    }
    
    // Update area
    setAreaMaps(prevMaps => {
      const newMaps = [...prevMaps];
      newMaps[state.index!] = area;
      return newMaps;
    });
  };

  const handleResizeEnd = () => {
    
    resizeStateRef.current = {
      index: null,
      handle: null,
      startX: 0,
      startY: 0,
      originalArea: null
    };
    
    setResizingIndex(null);
    setResizeHandle(null);
    // setResizeStart(null);
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleDeleteArea = async (area: AreaMap) => {
    if (!confirm('Delete this area map? This will be saved immediately.')) {
      return;
    }
    
    // Remove from local state
    const updatedMaps = areaMaps.filter(a => a !== area);
    setAreaMaps(updatedMaps);
    
    // Save to database immediately
    try {
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaMaps: updatedMaps }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Silently saved
      } else {
        alert('Error deleting area map: ' + result.error);
        // Revert on error
        fetchAreaMaps();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete area map');
      // Revert on error
      fetchAreaMaps();
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaMaps }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('All area maps saved successfully!');
        fetchAreaMaps();
        fetchAvailableAreaMaps(); // Refresh the available area maps list
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save area maps');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch all pages for navigation and copy/paste
  const fetchAllPages = async () => {
    try {
      const response = await fetch(`/api/editions/${editionId}/pages`);
      const result = await response.json();
      if (result.success && result.data) {
        setAllPages(result.data);
        return result.data;
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
    return [];
  };

  // Copy all area maps from current page
  const handleCopyAreaMaps = () => {
    if (areaMaps.length === 0) {
      alert('No area maps to copy!');
      return;
    }
    
    // Create a clean copy without IDs (so they get new IDs when pasted)
    const cleanAreaMaps = areaMaps.map(area => ({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      title: area.title,
      url: area.url,
      linked_area_ids: [], // Reset linked areas for copied maps
    }));
    
    setCopiedAreaMaps(cleanAreaMaps);
    alert(`Copied ${areaMaps.length} area maps to clipboard!`);
  };

  // Navigate to previous page
  const handlePreviousPage = async () => {
    const pages = allPages.length > 0 ? allPages : await fetchAllPages();
    const currentIndex = pages.findIndex((p: any) => p.id === parseInt(pageId));
    
    if (currentIndex > 0) {
      const prevPage = pages[currentIndex - 1];
      router.push(`/admin/editions/${editionId}/pages/${prevPage.id}/area-maps`);
    } else {
      alert('This is the first page!');
    }
  };

  // Navigate to next page
  const handleNextPage = async () => {
    const pages = allPages.length > 0 ? allPages : await fetchAllPages();
    const currentIndex = pages.findIndex((p: any) => p.id === parseInt(pageId));
    
    if (currentIndex >= 0 && currentIndex < pages.length - 1) {
      const nextPage = pages[currentIndex + 1];
      router.push(`/admin/editions/${editionId}/pages/${nextPage.id}/area-maps`);
    } else {
      alert('This is the last page!');
    }
  };

  // Paste area maps to selected pages
  const handlePasteToPages = async (targetPageIds: number[]) => {
    if (copiedAreaMaps.length === 0) {
      alert('No area maps copied! Please copy area maps first.');
      return;
    }

    // Check if any target pages already have area maps
    const pagesWithAreaMaps = targetPageIds.filter(pageId => 
      availableAreaMaps.some(area => area.page_id === pageId)
    );

    if (pagesWithAreaMaps.length > 0) {
      const pageNumbers = allPages
        .filter(p => pagesWithAreaMaps.includes(p.id))
        .map(p => p.page_number)
        .join(', ');
      
      if (!confirm(`Warning: Page(s) ${pageNumbers} already have area maps. This will replace them. Continue?`)) {
        return;
      }
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const targetPageId of targetPageIds) {
        try {
          const response = await fetch(`/api/editions/${editionId}/pages/${targetPageId}/area-maps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ areaMaps: copiedAreaMaps }),
          });
          
          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to paste to page ${targetPageId}:`, result.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error pasting to page ${targetPageId}:`, error);
        }
      }

      if (successCount > 0) {
        alert(`Successfully pasted area maps to ${successCount} page(s)!${errorCount > 0 ? ` ${errorCount} failed.` : ''}`);
        setShowPasteOptions(false);
        setSelectedPages([]);
      } else {
        alert('Failed to paste area maps to any pages.');
      }
    } catch (error) {
      console.error('Paste error:', error);
      alert('Failed to paste area maps');
    }
  };

  // Paste to all pages
  const handlePasteToAllPages = async () => {
    const pages = allPages.length > 0 ? allPages : await fetchAllPages();
    const allPageIds = pages.map((p: any) => p.id).filter((id: number) => id !== parseInt(pageId));
    
    if (allPageIds.length === 0) {
      alert('No other pages found!');
      return;
    }

    if (confirm(`Paste area maps to all ${allPageIds.length} other pages?`)) {
      await handlePasteToPages(allPageIds);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!page) {
    return <div className="p-6">Page not found</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/editions/${editionId}/pages`}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Area Maps - Page {page.page_number}
          </h1>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-2">
        <Link href="/admin/editions" className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          All Editions »
        </Link>
        <button className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          Edit Edition »
        </button>
        <Link href={`/admin/editions/${editionId}/pages`} className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          Upload/Manage Pages »
        </Link>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded">
          Edit Area Maps »
        </button>
        <Link href={`/epaper/view/${editionId}`} target="_blank" className="px-4 py-2 text-blue-600 text-sm font-medium rounded hover:bg-blue-50">
          View
        </Link>
      </div>

      {/* Editor Info */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="flex border-b border-gray-200">
          <button className="px-6 py-3 bg-blue-600 text-white font-medium">
            New Editor
          </button>
        </div>
        <div className="p-4 bg-blue-50">
          <p className="text-sm text-blue-800">
            This is new editor can be used on touch devices like mobile phones too.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        {/* First Row - Main Actions */}
        <div className="flex flex-wrap gap-3 mb-3">
          <button
            onClick={handleAddClipArea}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Clip Area
          </button>
          <button
            onClick={handleSaveAll}
            disabled={areaMaps.length === 0 || isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <SaveIcon className="w-4 h-4" /> {isSaving ? 'Saving...' : `Save All Area Maps (${areaMaps.length})`}
          </button>

        </div>

        {/* Second Row - Navigation and Copy */}
        <div className="flex flex-wrap gap-3 mb-3">
          <button
            onClick={handlePreviousPage}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Page
          </button>
          <button
            onClick={handleNextPage}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2 text-sm font-medium"
          >
            Next Page <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyAreaMaps}
            disabled={areaMaps.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            title="Copy all area maps from this page"
          >
            <Copy className="w-4 h-4" /> Copy All Area Maps
          </button>
        </div>

        {/* Third Row - Paste Options */}
        {copiedAreaMaps.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm text-gray-600 font-medium">
                📋 {copiedAreaMaps.length} area maps copied:
              </span>
              <button
                onClick={handlePasteToAllPages}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
              >
                <Clipboard className="w-4 h-4" /> Paste to All Pages
              </button>
              <button
                onClick={() => setShowPasteOptions(!showPasteOptions)}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
              >
                <Clipboard className="w-4 h-4" /> Paste to Selected Pages
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Paste to Selected Pages Modal */}
      {showPasteOptions && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Select Pages to Paste Area Maps</h3>
            <div className="text-xs text-gray-600 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border border-gray-300 rounded bg-white"></span>
                No area maps
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border border-green-300 rounded bg-green-50"></span>
                Has area maps
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            {allPages
              .filter((p: any) => p.id !== parseInt(pageId)) // Exclude current page
              .map((page: any) => {
                const hasAreaMaps = availableAreaMaps.some(area => area.page_id === page.id);
                return (
                  <label
                    key={page.id}
                    className={`flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer ${
                      hasAreaMaps ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    }`}
                    title={hasAreaMaps ? 'This page already has area maps' : 'This page has no area maps'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPages([...selectedPages, page.id]);
                        } else {
                          setSelectedPages(selectedPages.filter(id => id !== page.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm flex items-center gap-1">
                      Page {page.page_number}
                      {hasAreaMaps && <span className="text-green-600 text-xs">●</span>}
                    </span>
                  </label>
                );
              })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (selectedPages.length === 0) {
                  alert('Please select at least one page!');
                  return;
                }
                handlePasteToPages(selectedPages);
              }}
              disabled={selectedPages.length === 0}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
            >
              Paste to {selectedPages.length} Selected Page{selectedPages.length !== 1 ? 's' : ''}
            </button>
            <button
              onClick={() => {
                const otherPageIds = allPages
                  .filter((p: any) => p.id !== parseInt(pageId))
                  .map((p: any) => p.id);
                setSelectedPages(otherPageIds);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedPages([])}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowPasteOptions(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image Canvas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            <strong>Instructions:</strong> Click "Add Clip Area" button to create a new clip box. Click and drag the box to move it. Use corner/edge handles to resize.
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
            <span>Image Scale: {(imageScale * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        <div
          ref={containerRef}
          className="relative border-2 border-gray-300 rounded overflow-hidden"
          style={{ userSelect: 'none' }}
        >
          <div className="relative">
            <img
              ref={imageRef}
              src={page.image_url}
              alt={`Page ${page.page_number}`}
              className="w-full h-auto"
              onLoad={handleImageLoad}
              onError={(e) => {
                console.error('Failed to load page image:', page.image_url);
              }}
              draggable={false}
            />
          </div>
          
          {/* Render existing area maps */}
          {areaMaps.map((area, index) => (
            <div
              key={index}
              className="absolute group"
              style={{
                left: `${area.x * imageScale}px`,
                top: `${area.y * imageScale}px`,
                width: `${area.width * imageScale}px`,
                height: `${area.height * imageScale}px`,
              }}
            >
              {/* Action Buttons - Shown above the area */}
              <div className="absolute -top-10 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionIcons.Group>
                  <ActionIcons.Edit
                    onClick={async () => {
                      // Fetch latest available area maps before opening modal
                      try {
                        const response = await fetch(`/api/editions/${editionId}/all-area-maps`, {
                          cache: 'no-store',
                          headers: {
                            'Cache-Control': 'no-cache',
                          },
                        });
                        const result = await response.json();
                        if (result.success) {
                          setAvailableAreaMaps(result.data || []);
                          // Wait a bit for state to update
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }
                      } catch (error) {
                        console.error('Failed to fetch area maps:', error);
                      }
                      setEditingArea(area);
                      setShowEditModal(true);
                    }}
                    title="Edit"
                  />
                  <ActionIcons.Delete
                    onClick={() => handleDeleteArea(area)}
                    title="Delete"
                  />
                </ActionIcons.Group>
              </div>
              
              {/* Area Rectangle - Click and drag to move */}
              <div 
                className="w-full h-full border-2 border-red-500 bg-red-500/20 cursor-move hover:bg-red-500/30"
                onMouseDown={(e) => handleMoveStart(e, index)}
              >
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 pointer-events-none">
                  {index + 1}
                </div>
              </div>
              
              {/* Resize Handles - Show on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ResizeHandle position="top-left" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="top" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="top-right" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="left" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="right" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="bottom-left" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="bottom" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
                <ResizeHandle position="bottom-right" onResizeStart={(e, pos) => handleResizeStart(e, index, pos)} />
              </div>
            </div>
          ))}
          

        </div>
      </div>



      {/* Area Maps List */}
      {areaMaps.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold mb-3">Area Maps ({areaMaps.length})</h3>
          <div className="space-y-3">
            {areaMaps.map((area, index) => (
              <div key={index} id={`area-${index}`} className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">Area {index + 1}</span>
                  <ActionIcons.Delete
                    onClick={() => handleDeleteArea(area)}
                    title="Delete"
                    className="!p-1"
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={area.title}
                      onChange={(e) => {
                        const newMaps = [...areaMaps];
                        newMaps[index] = { ...area, title: e.target.value };
                        setAreaMaps(newMaps);
                      }}
                      className="w-full px-2 py-1 text-sm border rounded"
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="text"
                      value={area.url}
                      onChange={(e) => {
                        const newMaps = [...areaMaps];
                        newMaps[index] = { ...area, url: e.target.value };
                        setAreaMaps(newMaps);
                      }}
                      className="w-full px-2 py-1 text-sm border rounded"
                      placeholder="Enter URL"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingArea && (
        <AreaMapEditModal
          area={editingArea}
          availableAreaMaps={availableAreaMaps}
          currentPageId={pageId}
          onSave={handleSaveEditedArea}
          onClose={() => {
            setShowEditModal(false);
            setEditingArea(null);
          }}
        />
      )}
    </div>
  );
}
