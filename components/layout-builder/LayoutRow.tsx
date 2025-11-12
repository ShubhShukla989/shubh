'use client';

import { useState } from 'react';
import { Row, Column } from './types';
import { LayoutColumn } from './LayoutColumn';
import { ResizableRow } from './ResizableRow';

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

  return (
    <ResizableRow
      row={row}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex gap-2 mb-3">
        <button
          onClick={addColumn}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center gap-1"
        >
          <span>+</span> Add Column
        </button>
      </div>

      {row.columns.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded">
          Click "Add Column" to add columns to this row
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
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
    </ResizableRow>
  );
}
