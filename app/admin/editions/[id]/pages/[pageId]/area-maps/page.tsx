'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Trash2, Edit, Save } from 'lucide-react';
import Link from 'next/link';

interface AreaMap {
  id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url: string;
  isNew?: boolean;
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
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRectRef = useRef<HTMLDivElement>(null);
  
  // Use refs for drawing state to avoid re-renders
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentRectRef = useRef<AreaMap | null>(null);

  useEffect(() => {
    fetchPage();
    fetchAreaMaps();
  }, [pageId]);

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

  const handleImageDoubleClick = () => {
    alert('Drawing mode enabled! Click and drag to create an area.');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / imageScale);
    const y = ((e.clientY - rect.top) / imageScale);
    
    isDrawingRef.current = true;
    drawStartRef.current = { x, y };
    currentRectRef.current = { x, y, width: 0, height: 0, title: '', url: '' };
    
    // Show the drawing rectangle
    if (drawingRectRef.current) {
      drawingRectRef.current.style.display = 'block';
      drawingRectRef.current.style.left = `${x * imageScale}px`;
      drawingRectRef.current.style.top = `${y * imageScale}px`;
      drawingRectRef.current.style.width = '0px';
      drawingRectRef.current.style.height = '0px';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRef.current || !drawStartRef.current || !drawingRectRef.current) return;
    
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / imageScale);
    const currentY = ((e.clientY - rect.top) / imageScale);
    
    const width = currentX - drawStartRef.current.x;
    const height = currentY - drawStartRef.current.y;
    
    const finalX = width > 0 ? drawStartRef.current.x : currentX;
    const finalY = height > 0 ? drawStartRef.current.y : currentY;
    const finalWidth = Math.abs(width);
    const finalHeight = Math.abs(height);
    
    currentRectRef.current = {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
      title: '',
      url: '',
    };
    
    // Update the drawing rectangle directly via DOM (no re-render)
    drawingRectRef.current.style.left = `${finalX * imageScale}px`;
    drawingRectRef.current.style.top = `${finalY * imageScale}px`;
    drawingRectRef.current.style.width = `${finalWidth * imageScale}px`;
    drawingRectRef.current.style.height = `${finalHeight * imageScale}px`;
  };

  const handleMouseUp = () => {
    if (currentRectRef.current && currentRectRef.current.width > 10 && currentRectRef.current.height > 10) {
      // Add area immediately with default title
      const newArea = {
        ...currentRectRef.current,
        title: `Area ${areaMaps.length + 1}`,
        url: '#',
        isNew: false
      };
      setAreaMaps([...areaMaps, newArea]);
    }
    
    isDrawingRef.current = false;
    drawStartRef.current = null;
    currentRectRef.current = null;
    
    // Hide the drawing rectangle
    if (drawingRectRef.current) {
      drawingRectRef.current.style.display = 'none';
    }
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
      setLoading(true);
      const response = await fetch(`/api/editions/${editionId}/pages/${pageId}/area-maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaMaps }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('All area maps saved successfully!');
        fetchAreaMaps();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save area maps');
    } finally {
      setLoading(false);
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex gap-3">
        <button
          onClick={() => {
            alert('Drawing mode enabled! Click and drag on the image to create an area.');
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
        >
          + Add Area Map
        </button>
        <button
          onClick={handleSaveAll}
          disabled={areaMaps.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
        >
          💾 Save All Area Maps ({areaMaps.length})
        </button>
        <button
          onClick={async () => {
            // Fetch all pages to find the next one
            try {
              const response = await fetch(`/api/editions/${editionId}/pages`);
              const result = await response.json();
              if (result.success && result.data) {
                const pages = result.data;
                const currentIndex = pages.findIndex((p: any) => p.id === parseInt(pageId));
                if (currentIndex >= 0 && currentIndex < pages.length - 1) {
                  const nextPage = pages[currentIndex + 1];
                  router.push(`/admin/editions/${editionId}/pages/${nextPage.id}/area-maps`);
                } else {
                  alert('This is the last page!');
                }
              }
            } catch (error) {
              console.error('Failed to navigate:', error);
              alert('Failed to navigate to next page');
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          Next Page ▶
        </button>
      </div>

      {/* Image Canvas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            <strong>Instructions:</strong> Double-click the image to enable drawing mode, then click and drag to create clickable areas.
          </p>
        </div>
        
        <div
          ref={containerRef}
          className="relative border-2 border-gray-300 rounded overflow-hidden cursor-crosshair"
          style={{ userSelect: 'none' }}
        >
          <div className="relative">
            <img
              ref={imageRef}
              src={page.image_url}
              alt={`Page ${page.page_number}`}
              className="w-full h-auto"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                setImageScale(img.clientWidth / img.naturalWidth);
              }}
              draggable={false}
            />
            {/* Overlay to capture mouse events */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'auto' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={handleImageDoubleClick}
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
                <button
                  onClick={() => {
                    // Scroll to the area in the list below
                    const element = document.getElementById(`area-${index}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="p-2 bg-green-500 text-white rounded shadow-lg hover:bg-green-600"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteArea(area)}
                  className="p-2 bg-red-500 text-white rounded shadow-lg hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    alert('Area saved! Click "Save All Area Maps" to save permanently.');
                  }}
                  className="p-2 bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
              
              {/* Area Rectangle */}
              <div className="w-full h-full border-2 border-red-500 bg-red-500/20 cursor-pointer hover:bg-red-500/30">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
          
          {/* Render current drawing rectangle - using ref for smooth performance */}
          <div
            ref={drawingRectRef}
            className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{
              display: 'none',
              left: '0px',
              top: '0px',
              width: '0px',
              height: '0px',
            }}
          />
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
                  <button
                    onClick={() => handleDeleteArea(area)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
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
    </div>
  );
}
