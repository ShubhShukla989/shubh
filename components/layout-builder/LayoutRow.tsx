'use client';

import { useState, useEffect } from 'react';
import { Row, Column } from './types';
import { LayoutColumn } from './LayoutColumn';
import { RowPropertiesModal } from './RowPropertiesModal';

interface LayoutRowProps {
  row: Row;
  onUpdate: (row: Row) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function LayoutRow({ row, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, onDragStart, onDragEnd }: LayoutRowProps) {

  const addColumn = () => {
    // Calculate default width based on existing columns
    const existingColumns = row.columns.length;
    const defaultWidth = existingColumns === 0 ? '12' : '6'; // Full width if first, half if adding more
    
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      width: 12,
      widgets: [],
      rows: [],
      properties: {
        extraSmallWidth: '12', // Full width on mobile
        smallWidth: '12',      // Full width on small tablets
        mediumWidth: defaultWidth, // Responsive on medium
        largeWidth: defaultWidth,  // Responsive on large
        extraLargeWidth: defaultWidth, // Responsive on XL
        cssClass: '',
        customStyle: '',
      },
    };
    onUpdate({ ...row, columns: [...row.columns, newColumn] });
  };

  const deleteColumn = (colId: string) => {
    onUpdate({
      ...row,
      columns: row.columns.filter(c => c.id !== colId),
    });
  };

  const updateColumn = (colId: string, updatedColumn: any) => {
    onUpdate({
      ...row,
      columns: row.columns.map(c => c.id === colId ? updatedColumn : c),
    });
  };

  const [showRowProperties, setShowRowProperties] = useState(false);

  return (
    <div 
      className="rounded bg-white p-3 mb-4 transition-shadow shadow-md hover:shadow-lg w-full"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart();
      }}
      onDragEnd={(e) => {
        if (onDragEnd) onDragEnd();
      }}
    >
      {/* Drag Handle - Top Bar */}
      <div 
        className="bg-blue-500 hover:bg-blue-600 cursor-move -mx-3 -mt-3 mb-3 px-3 py-2 rounded-t flex items-center justify-between transition-all"
        title="Drag to reorder"
      >
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          <span className="text-white text-[10px] font-bold">DRAG TO REORDER</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-0.5">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all"
              title="Move Up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all"
              title="Move Down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-all"
            title="Duplicate"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm transition-all"
            title="Delete"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={addColumn}
          className="px-2 py-1 bg-teal-500 text-white rounded text-xs hover:bg-teal-600 flex items-center gap-1 shadow-sm transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Column
        </button>
        
        {/* Three Dots Button - Row Settings */}
        <button
          onClick={() => setShowRowProperties(true)}
          className="px-1.5 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center shadow-sm transition-all"
          title="Row Properties"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        
        {/* Delete Row Button */}
        <button
          onClick={onDelete}
          className="px-1.5 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center shadow-sm transition-all"
          title="Delete Row"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {row.columns.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded">
          Click "Add Column" to add columns to this row
        </div>
      ) : (
        <div className="flex flex-wrap">
          {row.columns.map((column) => (
            <LayoutColumn
              key={column.id}
              column={column}
              onUpdate={(updatedColumn) => updateColumn(column.id, updatedColumn)}
              onDelete={() => deleteColumn(column.id)}
            />
          ))}
        </div>
      )}

      {/* Row Properties Modal */}
      {showRowProperties && (
        <RowPropertiesModal
          row={row}
          onSave={(properties) => {
            onUpdate({
              ...row,
              ...properties,
            });
          }}
          onClose={() => setShowRowProperties(false)}
        />
      )}
    </div>
  );
}
