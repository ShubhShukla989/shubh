'use client';

import React from 'react';

type HandlePosition = 
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

interface ResizeHandleProps {
  position: HandlePosition;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, position: HandlePosition) => void;
}

const getCursorStyle = (position: HandlePosition): string => {
  const cursorMap: Record<HandlePosition, string> = {
    'top-left': 'nwse-resize',
    'top': 'ns-resize',
    'top-right': 'nesw-resize',
    'left': 'ew-resize',
    'right': 'ew-resize',
    'bottom-left': 'nesw-resize',
    'bottom': 'ns-resize',
    'bottom-right': 'nwse-resize',
  };
  return cursorMap[position];
};

const getPositionStyle = (position: HandlePosition): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    width: '6px',
    height: '6px',
    backgroundColor: 'white',
    border: '2px solid #ef4444',
    borderRadius: '1px',
    zIndex: 20,
    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
  };

  const largeStyle: React.CSSProperties = {
    ...baseStyle,
    width: '18px',
    height: '18px',
  };

  // All handles placed inside the bounding box (2px inset from edges)
  switch (position) {
    case 'top-left':
      return { ...baseStyle, top: '2px', left: '2px' };
    case 'top':
      return { ...baseStyle, top: '2px', left: '50%', transform: 'translateX(-50%)' };
    case 'top-right':
      return { ...baseStyle, top: '2px', right: '2px' };
    case 'left':
      return { ...baseStyle, top: '50%', left: '2px', transform: 'translateY(-50%)' };
    case 'right':
      return { ...baseStyle, top: '50%', right: '2px', transform: 'translateY(-50%)' };
    case 'bottom-left':
      return { ...baseStyle, bottom: '2px', left: '2px' };
    case 'bottom':
      return { ...baseStyle, bottom: '2px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
      // Primary resize handle — 3× larger, inset from corner
      return { ...largeStyle, bottom: '2px', right: '2px' };
  }
};

export default function ResizeHandle({ position, onResizeStart }: ResizeHandleProps) {
  const cursor = getCursorStyle(position);
  const positionStyle = getPositionStyle(position);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(e, position);
  };

  return (
    <div
      className="resize-handle hover:bg-red-500 hover:scale-110 transition-all"
      style={{
        ...positionStyle,
        cursor,
        touchAction: 'none',
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      title={`Resize from ${position}`}
    />
  );
}
