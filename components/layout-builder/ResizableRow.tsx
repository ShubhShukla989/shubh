'use client';

import { useState, useRef, useEffect } from 'react';
import { Row } from './types';

interface ResizableRowProps {
  row: Row;
  onUpdate: (row: Row) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
}

export function ResizableRow({
  row,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  children,
}: ResizableRowProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    minHeight: (row as any).minHeight || '100px',
    width: (row as any).width || '100%',
    maxWidth: (row as any).maxWidth || '100%',
    padding: (row as any).padding || '12px',
    marginLeft: (row as any).marginLeft || '0px',
  });

  const rowRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent, direction: 'height' | 'width' | 'left') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startY = e.clientY;
    const startX = e.clientX;
    const startHeight = rowRef.current?.offsetHeight || 0;
    const startWidth = rowRef.current?.offsetWidth || 0;
    const startLeft = rowRef.current?.offsetLeft || 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (direction === 'height') {
        const deltaY = e.clientY - startY;
        const newMinHeight = Math.max(50, startHeight + deltaY);
        setDimensions(prev => ({ ...prev, minHeight: `${newMinHeight}px` }));
      } else if (direction === 'width') {
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(200, startWidth + deltaX);
        setDimensions(prev => ({ ...prev, width: `${newWidth}px` }));
      } else if (direction === 'left') {
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(200, startWidth - deltaX);
        const newMarginLeft = startLeft + deltaX;
        setDimensions(prev => ({ 
          ...prev, 
          width: `${newWidth}px`,
          marginLeft: `${newMarginLeft}px`
        }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Save dimensions to row
      onUpdate({
        ...row,
        minHeight: dimensions.minHeight,
        width: dimensions.width,
        padding: dimensions.padding,
      } as any);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };



  return (
    <div
      ref={rowRef}
      className={`relative border-2 rounded bg-white transition-all border-blue-400 ${
        isResizing ? 'select-none' : ''
      }`}
      style={{
        minHeight: dimensions.minHeight,
        width: dimensions.width,
        maxWidth: dimensions.maxWidth,
        padding: dimensions.padding,
        marginLeft: dimensions.marginLeft,
        flexShrink: 0,
      }}
    >
      {/* Row Header */}
      <div className="bg-blue-100 p-2 flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <div 
            draggable="true"
            onDragStart={(e) => {
              onDragStart?.();
            }}
            onDragEnd={(e) => {
              onDragEnd?.();
            }}
            className="cursor-move px-2 py-1 hover:bg-blue-200 rounded flex items-center active:opacity-50 select-none"
            title="Drag to reorder"
            style={{ touchAction: 'none' }}
          >
            <span className="text-lg text-gray-600 pointer-events-none">⋮⋮</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={onDuplicate}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            📋
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            🗑️
          </button>
          <span className="text-xs text-gray-600">
            {dimensions.width} × min {dimensions.minHeight}
          </span>
        </div>

        <div className="flex gap-2">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              ↓
            </button>
          )}
        </div>
      </div>

      {/* Row Content */}
      {!isCollapsed && (
        <div className="p-3 relative overflow-hidden">
          {children}
        </div>
      )}

      {/* Resize Handles */}
      {!isCollapsed && (
        <>
          {/* Bottom resize handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'height')}
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-300 transition-colors z-10"
            title="Drag to resize height"
          />

          {/* Left resize handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'left')}
            className="absolute top-0 left-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-300 transition-colors z-10"
            title="Drag to resize width (left)"
          />

          {/* Right resize handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'width')}
            className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-300 transition-colors z-10"
            title="Drag to resize width (right)"
          />

          {/* Bottom-left corner resize handle */}
          <div
            onMouseDown={(e) => {
              handleMouseDown(e, 'height');
              handleMouseDown(e, 'left');
            }}
            className="absolute bottom-0 left-0 w-4 h-4 bg-blue-500 cursor-nesw-resize hover:bg-blue-600 rounded-tr z-20"
            title="Drag to resize both (left)"
          />

          {/* Bottom-right corner resize handle */}
          <div
            onMouseDown={(e) => {
              handleMouseDown(e, 'height');
              handleMouseDown(e, 'width');
            }}
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize hover:bg-blue-600 rounded-tl z-20"
            title="Drag to resize both (right)"
          />
        </>
      )}

      {/* Dimension overlay when resizing */}
      {isResizing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded text-sm pointer-events-none z-30">
          {dimensions.width} × min {dimensions.minHeight}
        </div>
      )}
    </div>
  );
}
