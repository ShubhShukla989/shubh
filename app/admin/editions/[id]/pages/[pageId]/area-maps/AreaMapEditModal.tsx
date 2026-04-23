'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AreaMap {
  id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url: string;
  linked_area_ids?: number[];
}

interface AvailableAreaMap {
  id: number;
  page_id: number;
  page_number: number;
  title: string;
  linked_area_ids?: number[];
}

interface AreaMapEditModalProps {
  area: AreaMap;
  availableAreaMaps: AvailableAreaMap[];
  currentPageId: string;
  onSave: (area: AreaMap) => void;
  onClose: () => void;
}

export default function AreaMapEditModal({
  area,
  availableAreaMaps,
  currentPageId: _currentPageId,
  onSave,
  onClose,
}: AreaMapEditModalProps) {
  const [editedArea, setEditedArea] = useState<AreaMap>({
    ...area,
    // Ensure linked_area_ids is always an array of numbers
    linked_area_ids: Array.isArray(area.linked_area_ids) 
      ? area.linked_area_ids.map(id => typeof id === 'string' ? parseInt(id) : id)
      : (area.linked_area_ids ? JSON.parse(area.linked_area_ids as string).map((id: any) => typeof id === 'string' ? parseInt(id) : id) : [])
  });
  const [localAvailableAreas, setLocalAvailableAreas] = useState<AvailableAreaMap[]>(availableAreaMaps);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update local state when props change (important for fresh data)
  useEffect(() => {
    const processedLinkedIds = Array.isArray(area.linked_area_ids) 
      ? area.linked_area_ids.map((id: any) => typeof id === 'string' ? parseInt(id) : id)
      : (area.linked_area_ids ? JSON.parse(area.linked_area_ids as string).map((id: any) => typeof id === 'string' ? parseInt(id) : id) : []);
    
    // Clean up orphaned IDs - only keep IDs that exist in availableAreaMaps
    const availableIds = availableAreaMaps.map((area: any) => Number(area.id));
    const cleanedLinkedIds = processedLinkedIds.filter((id: any) => availableIds.includes(Number(id)));
    
    if (cleanedLinkedIds.length !== processedLinkedIds.length) {
      const removedIds = processedLinkedIds.filter((id: any) => !cleanedLinkedIds.includes(id));
      
      // Auto-save the cleaned IDs to database if there were changes
      if (area.id && removedIds.length > 0) {
        fetch(`/api/editions/${window.location.pathname.split('/')[3]}/area-maps/${area.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linked_area_ids: cleanedLinkedIds
          }),
        }).then(response => response.json()).then(result => {
          // Auto-cleanup completed
        }).catch(error => {
          // Auto-cleanup error
        });
      }
    }
    
    setEditedArea({
      ...area,
      // Use cleaned linked_area_ids
      linked_area_ids: cleanedLinkedIds
    });
  }, [area, availableAreaMaps]);

  // Update local state when props change
  useEffect(() => {
    setLocalAvailableAreas(availableAreaMaps);
  }, [availableAreaMaps]);

  // Center modal on mount
  useEffect(() => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      
      if (isMobile) {
        // Mobile: Full width with small margins, centered vertically
        setPosition({
          x: 16, // 16px margin from edges
          y: Math.max(20, (window.innerHeight - rect.height) / 2),
        });
      } else {
        // Desktop: Centered
        setPosition({
          x: (window.innerWidth - rect.width) / 2,
          y: (window.innerHeight - rect.height) / 2,
        });
      }
    }
  }, [isMobile]);

  // Handle mouse down on header (start dragging)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging on desktop
    if (isMobile) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle mouse move (dragging)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Filter out current area from available options (can't link to itself)
  const linkableAreas = localAvailableAreas.filter(a => a.id !== area.id);

  const handleSave = () => {
    // Validate required fields
    if (!editedArea.title.trim()) {
      alert('Please enter a title for the area map.');
      return;
    }
    
    // Ensure linked_area_ids is always an array
    const areaToSave = {
      ...editedArea,
      linked_area_ids: Array.isArray(editedArea.linked_area_ids) 
        ? editedArea.linked_area_ids 
        : []
    };
    
    onSave(areaToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8 flex flex-col relative"
        style={{
          // Only use custom positioning on desktop
          ...(!isMobile ? {
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y}px`,
            maxHeight: 'calc(90vh - 64px)',
          } : {
            // Mobile: use flexbox centering
            position: 'relative',
            margin: 'auto',
            maxWidth: 'calc(100vw - 32px)', // Account for padding
            maxHeight: 'calc(90vh - 64px)',
          })
        }}
      >
        {/* Header - Draggable on desktop only */}
        <div 
          className={`flex items-center justify-between p-4 sm:p-6 border-b select-none ${
            !isMobile ? 'cursor-move' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-xl sm:text-2xl font-bold">Edit Area Map</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={editedArea.title}
              onChange={(e) => setEditedArea({ ...editedArea, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Article, Breaking News"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              URL (optional)
            </label>
            <input
              type="text"
              value={editedArea.url}
              onChange={(e) => setEditedArea({ ...editedArea, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/article"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to just show the clipped image
            </p>
          </div>

          {/* Linked Areas - Multiple Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Link to Other Areas (Multi-page Article)
            </label>
            
            <div className="border border-gray-300 rounded p-3 max-h-60 overflow-y-auto space-y-2">
              {linkableAreas.length === 0 ? (
                <p className="text-sm text-gray-500">No other areas available to link</p>
              ) : (
                linkableAreas.map((linkArea) => {
                  // Ensure both IDs are numbers for proper comparison
                  const linkAreaId = typeof linkArea.id === 'string' ? parseInt(linkArea.id) : linkArea.id;
                  const linkedIds = (editedArea.linked_area_ids || []).map(id => 
                    typeof id === 'string' ? parseInt(id) : id
                  );
                  const isSelected = linkedIds.includes(linkAreaId);
                  
                  // Check if the other area also links back to this area (bidirectional)
                  const otherArea = availableAreaMaps.find(a => Number(a.id) === linkAreaId);
                  const otherAreaLinkedIds = otherArea?.linked_area_ids || [];
                  const isBidirectional = Array.isArray(otherAreaLinkedIds) 
                    ? otherAreaLinkedIds.includes(Number(area.id))
                    : false;
                  
                  return (
                    <label
                      key={linkArea.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentIds = (editedArea.linked_area_ids || []).map(id => 
                            typeof id === 'string' ? parseInt(id) : id
                          );
                          const newIds = e.target.checked
                            ? [...currentIds, linkAreaId]
                            : currentIds.filter(id => id !== linkAreaId);
                          
                          setEditedArea({
                            ...editedArea,
                            linked_area_ids: newIds
                          });
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm flex-1">
                        <span className="font-medium">Page {linkArea.page_number}</span>
                        {' - '}
                        <span className="text-gray-600">{linkArea.title || `Area #${linkArea.id}`}</span>
                        <span className="text-xs text-gray-400 ml-1">(ID: {linkArea.id})</span>
                        {isBidirectional && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 rounded">
                            ↔ Linked back
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ✓ Select multiple areas to link together (e.g., article spanning 3+ pages)
              <br />
              ✓ When you link areas, they will automatically link back to each other
              <br />
              ✓ <strong>Bidirectional linking:</strong> Area A ↔ Area B (both ways)
            </p>
            {(editedArea.linked_area_ids || []).length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-800">
                  {(editedArea.linked_area_ids || []).length} area(s) linked bidirectionally
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  These areas will automatically link back to this area
                </p>
                {/* Show cleanup info if there are orphaned IDs */}
                {(() => {
                  const availableIds = availableAreaMaps.map(area => Number(area.id));
                  const orphanedIds = (editedArea.linked_area_ids || []).filter(id => !availableIds.includes(Number(id)));
                  if (orphanedIds.length > 0) {
                    return (
                      <div className="mt-1 p-1 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          ⚠️ {orphanedIds.length} invalid link(s) detected: [{orphanedIds.join(', ')}]
                        </p>
                        <button
                          onClick={() => {
                            const cleanedIds = (editedArea.linked_area_ids || []).filter(id => availableIds.includes(Number(id)));
                            setEditedArea({
                              ...editedArea,
                              linked_area_ids: cleanedIds
                            });
                          }}
                          className="text-xs text-yellow-700 underline hover:text-yellow-900"
                        >
                          Clean up invalid links
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          {/* Position Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Position & Size</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">X:</span> {Math.round(editedArea.x)}px
              </div>
              <div>
                <span className="text-gray-600">Y:</span> {Math.round(editedArea.y)}px
              </div>
              <div>
                <span className="text-gray-600">Width:</span> {Math.round(editedArea.width)}px
              </div>
              <div>
                <span className="text-gray-600">Height:</span> {Math.round(editedArea.height)}px
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 sm:p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editedArea.title.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
