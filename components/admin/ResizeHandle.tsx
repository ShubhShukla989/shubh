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
    width: '12px',
    height: '12px',
    backgroundColor: 'white',
    border: '2px solid #ef4444',
    borderRadius: '1px',
    zIndex: 20,
    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
  };

  // Position the handle
  switch (position) {
    case 'top-left':
      return { ...baseStyle, top: '-6px', left: '-6px' };
    case 'top':
      return { ...baseStyle, top: '-6px', left: '50%', transform: 'translateX(-50%)' };
    case 'top-right':
      return { ...baseStyle, top: '-6px', right: '-6px' };
    case 'left':
      return { ...baseStyle, top: '50%', left: '-6px', transform: 'translateY(-50%)' };
    case 'right':
      return { ...baseStyle, top: '50%', right: '-6px', transform: 'translateY(-50%)' };
    case 'bottom-left':
      return { ...baseStyle, bottom: '-6px', left: '-6px' };
    case 'bottom':
      return { ...baseStyle, bottom: '-6px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
      return { ...baseStyle, bottom: '-6px', right: '-6px' };
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
        // Balanced hit area - visible handle with extended touch area
        padding: '6px',
        margin: '-6px',
        minWidth: '24px',
        minHeight: '24px',
        touchAction: 'none', // Prevent default touch behaviors
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      title={`Resize from ${position}`}
    />
  );
}
