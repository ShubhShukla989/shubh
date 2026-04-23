'use client';

import { useState, useEffect } from 'react';
import { CustomCodeModal } from './CustomCodeModal';
import { LayoutStructure, Row } from './types';
import { LayoutRow } from './LayoutRow';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { generateRowId, generateColumnId, generateWidgetId } from '@/lib/utils/idGenerator';

interface LayoutBuilderProps {
  structure: LayoutStructure;
  onChange: (structure: LayoutStructure) => void;
  customCss: string;
  customJs: string;
  onCustomCssChange: (css: string) => void;
  onCustomJsChange: (js: string) => void;
}

export function LayoutBuilder({
  structure,
  onChange,
  customCss,
  customJs,
  onCustomCssChange,
  onCustomJsChange,
}: LayoutBuilderProps) {
  const [showCustomCode, setShowCustomCode] = useState(false);
  const [screenSize, setScreenSize] = useState<'xl'>('xl');
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [rowToDelete, setRowToDelete] = useState<{ id: string; widgetCount: number } | null>(null);

  const addRow = () => {
    const newRow: Row = {
      id: generateRowId(),
      columns: [],
    };
    onChange({ ...structure, rows: [...structure.rows, newRow] });
  };

  const deleteRow = (rowId: string) => {
    const rowToDeleteData = structure.rows.find(r => r.id === rowId);
    
    // Check if row has content
    if (rowToDeleteData && rowToDeleteData.columns && rowToDeleteData.columns.length > 0) {
      const totalWidgets = rowToDeleteData.columns.reduce((count, col) => count + (col.widgets?.length || 0), 0);
      if (totalWidgets > 0) {
        setRowToDelete({ id: rowId, widgetCount: totalWidgets });
        return;
      }
    }
    
    // Delete immediately if no widgets
    onChange({
      ...structure,
      rows: structure.rows.filter(r => r.id !== rowId),
    });
  };

  const confirmDeleteRow = () => {
    if (rowToDelete) {
      onChange({
        ...structure,
        rows: structure.rows.filter(r => r.id !== rowToDelete.id),
      });
      setRowToDelete(null);
    }
  };

  const duplicateRow = (rowId: string) => {
    const rowIndex = structure.rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;
    
    const rowToDuplicate = structure.rows[rowIndex];
    const newRow = JSON.parse(JSON.stringify(rowToDuplicate));
    
    // Generate unique IDs for duplicated row and all nested elements
    newRow.id = generateRowId();
    
    // Update column IDs and widget IDs to prevent conflicts
    newRow.columns = newRow.columns.map((col: any) => ({
      ...col,
      id: generateColumnId(),
      widgets: col.widgets.map((widget: any) => ({
        ...widget,
        id: generateWidgetId()
      }))
    }));
    
    const newRows = [...structure.rows];
    newRows.splice(rowIndex + 1, 0, newRow);
    onChange({ ...structure, rows: newRows });
  };

  const updateRow = (rowId: string, updatedRow: any) => {
    // Comprehensive validation of the updated row structure
    if (!updatedRow || !updatedRow.id || !Array.isArray(updatedRow.columns)) {
      return;
    }
    
    // Validate each column in the row
    const validColumns = updatedRow.columns.filter((col: any) => 
      col && col.id && Array.isArray(col.widgets) && Array.isArray(col.rows || [])
    );
    
    // Only update if all columns are valid
    if (validColumns.length === updatedRow.columns.length) {
      onChange({
        ...structure,
        rows: structure.rows.map(r => r.id === rowId ? { ...updatedRow, columns: validColumns } : r),
      });
    }
  };

  const moveRow = (rowId: string, direction: 'up' | 'down') => {
    const index = structure.rows.findIndex(r => r.id === rowId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= structure.rows.length) return;
    
    const newRows = [...structure.rows];
    [newRows[index], newRows[newIndex]] = [newRows[newIndex], newRows[index]];
    onChange({ ...structure, rows: newRows });
  };

  // Drag and drop handlers
  const handleDragStart = (rowId: string) => {
    setDraggedRowId(rowId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedRowId) {
      return;
    }
    
    const draggedIndex = structure.rows.findIndex(r => r.id === draggedRowId);
    
    if (draggedIndex === -1) {
      setDraggedRowId(null);
      setDropTargetIndex(null);
      return;
    }

    if (draggedIndex === targetIndex) {
      setDraggedRowId(null);
      setDropTargetIndex(null);
      return;
    }

    const newRows = [...structure.rows];
    const [draggedRow] = newRows.splice(draggedIndex, 1);
    newRows.splice(targetIndex, 0, draggedRow);

    onChange({ ...structure, rows: newRows });
    setDraggedRowId(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedRowId(null);
    setDropTargetIndex(null);
  };

  const screenSizes = {
    xl: { label: 'Extra Large', width: '100%' },
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-blue-600 p-3 rounded flex items-center justify-between shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="px-3 py-2 bg-teal-500 text-white text-xs hover:bg-teal-600 flex items-center justify-center font-medium shadow-sm transition-all"
            title="Add Row"
          >
            Add Row
          </button>
          <button
            onClick={() => setShowCustomCode(true)}
            className="px-3 py-2 bg-green-500 text-white text-xs hover:bg-green-600 flex items-center justify-center font-medium shadow-sm transition-all"
            title="Custom CSS/JS"
          >
            Custom CSS/JS
          </button>
        </div>
        
        <div className="w-8 h-8 font-medium shadow-sm transition-all flex items-center justify-center bg-yellow-400 text-black hover:bg-yellow-500 text-xs"
             title="Extra Large">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>

      {/* Canvas - Scrollable Container */}
      <div 
        className="bg-white border-2 border-gray-300 p-6 rounded min-h-[400px] shadow-inner overflow-auto"
        style={{ 
          maxWidth: '100%',
          maxHeight: 'none',
          margin: '0 auto',
          transition: 'max-width 0.3s ease'
        }}
      >
        <div
          className="relative border border-blue-500 rounded-lg p-4"
          style={{
            width: screenSizes[screenSize].width,
            minHeight: structure.rows.length === 0 ? '600px' : 'auto',
            height: 'auto',
            boxSizing: 'border-box',
            overflow: 'visible',
          }}
        >
        {structure.rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No rows yet</p>
            <p className="text-sm">Click "Add Row" to start building your layout</p>
          </div>
        ) : (
          <div className="">
            {structure.rows.map((row, index) => (
              <div
                key={row.id}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={dropTargetIndex === index ? 'border-t-4 border-green-500' : ''}
              >
                <LayoutRow
                  row={row}
                  onUpdate={(updatedRow) => updateRow(row.id, updatedRow)}
                  onDelete={() => deleteRow(row.id)}
                  onDuplicate={() => duplicateRow(row.id)}
                  onMoveUp={index > 0 ? () => moveRow(row.id, 'up') : undefined}
                  onMoveDown={index < structure.rows.length - 1 ? () => moveRow(row.id, 'down') : undefined}
                  onDragStart={() => handleDragStart(row.id)}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Custom Code Modal */}
      {showCustomCode && (
        <CustomCodeModal
          css={customCss}
          js={customJs}
          onCssChange={onCustomCssChange}
          onJsChange={onCustomJsChange}
          onClose={() => setShowCustomCode(false)}
        />
      )}

      {/* Row Delete Confirmation Modal */}
      {rowToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Row"
          message={`This row contains ${rowToDelete.widgetCount} widget(s). Are you sure you want to delete it? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteRow}
          onCancel={() => setRowToDelete(null)}
        />
      )}
    </div>
  );
}
