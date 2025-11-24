'use client';

import { useState } from 'react';
import { CustomCodeModal } from './CustomCodeModal';
import { LayoutStructure, Row } from './types';
import { LayoutRow } from './LayoutRow';

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
  const [screenSize, setScreenSize] = useState<'xl' | 'lg' | 'md' | 'sm' | 'xs'>('xl');
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const addRow = () => {
    const newRow: Row = {
      id: `row-${Date.now()}`,
      columns: [],
    };
    onChange({ ...structure, rows: [...structure.rows, newRow] });
  };

  const deleteRow = (rowId: string) => {
    onChange({
      ...structure,
      rows: structure.rows.filter(r => r.id !== rowId),
    });
  };

  const duplicateRow = (rowId: string) => {
    const rowIndex = structure.rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;
    
    const rowToDuplicate = structure.rows[rowIndex];
    const newRow = JSON.parse(JSON.stringify(rowToDuplicate));
    newRow.id = `row-${Date.now()}`;
    
    const newRows = [...structure.rows];
    newRows.splice(rowIndex + 1, 0, newRow);
    onChange({ ...structure, rows: newRows });
  };

  const updateRow = (rowId: string, updatedRow: any) => {
    onChange({
      ...structure,
      rows: structure.rows.map(r => r.id === rowId ? updatedRow : r),
    });
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
    lg: { label: 'Large', width: '1200px' },
    md: { label: 'Medium', width: '992px' },
    sm: { label: 'Small', width: '768px' },
    xs: { label: 'Mobile', width: '375px' },
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded flex items-center justify-between shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 flex items-center gap-2 font-medium shadow-md transition-all hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>
          <button
            onClick={() => setShowCustomCode(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2 font-medium shadow-md transition-all hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Custom CSS/JS
          </button>
        </div>
        
        <button
          onClick={() => setScreenSize(screenSize === 'xl' ? 'lg' : 'xl')}
          className={`px-4 py-2 rounded font-medium shadow-md transition-all hover:shadow-lg flex items-center gap-2 ${
            screenSize === 'xl'
              ? 'bg-yellow-400 text-black hover:bg-yellow-500'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          {screenSize === 'xl' ? 'Extra Large' : 'Large'}
        </button>
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
          className="relative border-4 border-blue-500 rounded-lg p-4"
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
          <div className="space-y-4">
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
    </div>
  );
}
