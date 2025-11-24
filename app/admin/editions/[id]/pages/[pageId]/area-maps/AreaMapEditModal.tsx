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
  const [editedArea, setEditedArea] = useState<AreaMap>(area);
  const [localAvailableAreas, setLocalAvailableAreas] = useState<AvailableAreaMap[]>(availableAreaMaps);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalAvailableAreas(availableAreaMaps);
  }, [availableAreaMaps]);

  // Center modal on mount
  useEffect(() => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setPosition({
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2,
      });
    }
  }, []);

  // Handle mouse down on header (start dragging)
  const handleMouseDown = (e: React.MouseEvent) => {
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
    onSave(editedArea);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden absolute"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Header - Draggable */}
        <div 
          className="flex items-center justify-between p-4 sm:p-6 border-b cursor-move select-none"
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
        <div className="p-4 sm:p-6 space-y-4 overflow-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link to Other Areas (Multi-page Article)
            </label>
            <div className="border border-gray-300 rounded p-3 max-h-60 overflow-y-auto space-y-2">
              {linkableAreas.length === 0 ? (
                <p className="text-sm text-gray-500">No other areas available to link</p>
              ) : (
                linkableAreas.map((linkArea) => {
                  const isSelected = (editedArea.linked_area_ids || []).includes(linkArea.id);
                  return (
                    <label
                      key={linkArea.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentIds = editedArea.linked_area_ids || [];
                          const newIds = e.target.checked
                            ? [...currentIds, linkArea.id]
                            : currentIds.filter(id => id !== linkArea.id);
                          setEditedArea({
                            ...editedArea,
                            linked_area_ids: newIds
                          });
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Page {linkArea.page_number}</span>
                        {' - '}
                        <span className="text-gray-600">{linkArea.title || `Area #${linkArea.id}`}</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ✓ Select multiple areas to link together (e.g., article spanning 3+ pages)
              <br />
              ✓ When user clicks this area, all linked areas will be shown together
            </p>
            {(editedArea.linked_area_ids || []).length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-800">
                  {(editedArea.linked_area_ids || []).length} area(s) linked
                </p>
              </div>
            )}
          </div>

          {/* Position Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Position & Size</h3>
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
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
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
