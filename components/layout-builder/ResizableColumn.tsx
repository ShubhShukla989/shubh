'use client';

import { Column } from './types';

interface ResizableColumnProps {
  column: Column;
  onUpdate: (column: Column) => void;
  onDelete: () => void;
  onShowProperties?: () => void;
  children: React.ReactNode;
}

export function ResizableColumn({ column, onUpdate, onDelete, onShowProperties, children }: ResizableColumnProps) {
  // Get responsive width from properties or default to 12 (full width)
  const getWidth = () => {
    const props = column.properties;
    return {
      xs: props?.extraSmallWidth || '12',
      sm: props?.smallWidth || '12',
      md: props?.mediumWidth || '12',
      lg: props?.largeWidth || '12',
      xl: props?.extraLargeWidth || '12',
    };
  };

  const widths = getWidth();
  const cssClass = column.properties?.cssClass || '';
  const customStyle = column.properties?.customStyle || '';

  // Calculate flex-basis as percentage of 12-column grid
  const flexBasis = `calc(${(parseInt(widths.xl) / 12) * 100}% - 12px)`;

  return (
    <div
      className={`relative border-2 border-gray-300 rounded bg-gray-50 min-h-[100px] ${cssClass}`}
      style={{
        flex: `1 1 ${flexBasis}`,
        minWidth: '0',
        maxWidth: '100%',
        ...(customStyle ? { cssText: customStyle } : {}),
      }}
    >
      {/* Column Header */}
      <div className="bg-gray-200 p-2 flex items-center justify-between">
        <div className="text-xs text-gray-600 font-mono flex items-center gap-2">
          <span className="font-semibold">Col</span>
          <span className="text-[10px] bg-white px-1 rounded">
            XS:{widths.xs} SM:{widths.sm} MD:{widths.md} LG:{widths.lg} XL:{widths.xl}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onShowProperties && (
            <button
              onClick={onShowProperties}
              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Column Properties"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Delete Column"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}
