'use client';

import { useState, useEffect } from 'react';
import { Row, Column } from './types';
import { LayoutColumn } from './LayoutColumn';
import { RowPropertiesModal } from './RowPropertiesModal';
import { showWarning } from '@/lib/utils/toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { generateColumnId } from '@/lib/utils/idGenerator';

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
  const [showRowProperties, setShowRowProperties] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<{ id: string; widgetCount: number } | null>(null);

  const addColumn = () => {
    // Prevent adding too many columns (Bootstrap grid limit)
    if (row.columns.length >= 12) {
      showWarning('Maximum 12 columns allowed per row');
      return;
    }
    
    // Calculate default width based on existing columns
    const existingColumns = row.columns.length;
    const defaultWidth = existingColumns === 0 ? '12' : '6'; // Full width if first, half if adding more
    
    const newColumn: Column = {
      id: generateColumnId(),
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
    const columnToDeleteData = row.columns.find(c => c.id === colId);
    
    // Check if column has widgets
    if (columnToDeleteData && columnToDeleteData.widgets && columnToDeleteData.widgets.length > 0) {
      setColumnToDelete({ id: colId, widgetCount: columnToDeleteData.widgets.length });
    } else {
      // Delete immediately if no widgets
      onUpdate({
        ...row,
        columns: row.columns.filter(c => c.id !== colId),
      });
    }
  };

  const confirmDeleteColumn = () => {
    if (columnToDelete) {
      onUpdate({
        ...row,
        columns: row.columns.filter(c => c.id !== columnToDelete.id),
      });
      setColumnToDelete(null);
    }
  };

  const updateColumn = (colId: string, updatedColumn: any) => {
    onUpdate({
      ...row,
      columns: row.columns.map(c => c.id === colId ? updatedColumn : c),
    });
  };

  return (
    <div 
      className="rounded bg-gray-100 p-3 transition-shadow shadow-md hover:shadow-lg w-full"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart();
      }}
      onDragEnd={(e) => {
        if (onDragEnd) onDragEnd();
      }}
    >
      {/* Content Area */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={addColumn}
          className="px-2 py-1 bg-green-500 text-white text-xs hover:bg-green-600 flex items-center gap-1 shadow-sm transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Column
        </button>
        
        {/* Three Lines Button - Row Settings */}
        <button
          onClick={() => setShowRowProperties(true)}
          className="w-6 h-6 bg-blue-500 text-white text-xs hover:bg-blue-600 flex items-center justify-center shadow-sm transition-all"
          title="Row Properties"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Delete Row Button */}
        <button
          onClick={onDelete}
          className="w-6 h-6 bg-red-500 text-white text-xs hover:bg-red-600 flex items-center justify-center shadow-sm transition-all"
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
              // Ensure properties are also saved in nested structure
              properties: {
                ...row.properties,
                ...properties.properties,
              }
            });
          }}
          onClose={() => setShowRowProperties(false)}
        />
      )}

      {/* Column Delete Confirmation Modal */}
      {columnToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Column"
          message={`This column contains ${columnToDelete.widgetCount} widget(s). Are you sure you want to delete it? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteColumn}
          onCancel={() => setColumnToDelete(null)}
        />
      )}
    </div>
  );
}
