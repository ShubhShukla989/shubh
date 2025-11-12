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
      <div className="bg-blue-600 p-3 rounded flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
          >
            <span>+</span> Add Row
          </button>
          <button
            onClick={() => setShowCustomCode(true)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 flex items-center gap-2"
          >
            <span>&lt;/&gt;</span> Custom CSS/JS
          </button>
        </div>
        
        <div className="flex gap-2">
          {Object.entries(screenSizes).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setScreenSize(key as any)}
              className={`px-3 py-1 rounded text-sm ${
                screenSize === key
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="bg-gray-100 p-4 rounded min-h-[400px]"
        style={{ 
          maxWidth: screenSizes[screenSize].width,
          margin: '0 auto',
          transition: 'max-width 0.3s ease'
        }}
      >
        {structure.rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No rows yet</p>
            <p className="text-sm">Click "Add Row" to start building your layout</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 items-start">
            {structure.rows.map((row, index) => (
              <div 
                key={row.id}
                className="relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropTargetIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop(e, index);
                }}
              >
                {/* Drop indicator overlay */}
                {dropTargetIndex === index && draggedRowId !== row.id && (
                  <div className="absolute inset-0 border-4 border-blue-500 rounded bg-blue-100 bg-opacity-30 pointer-events-none z-50 animate-pulse" />
                )}

                {/* The actual row */}
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

            {/* Drop zone at the end */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropTargetIndex(structure.rows.length);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(e, structure.rows.length);
              }}
              className={`transition-all flex-shrink-0 ${
                dropTargetIndex === structure.rows.length ? 'w-32 border-4 border-dashed border-blue-500 bg-blue-50' : 'w-8'
              }`}
              style={{ minHeight: '100px' }}
            >
              {dropTargetIndex === structure.rows.length && (
                <div className="flex items-center justify-center h-full text-blue-600 font-semibold text-sm">
                  Drop Here
                </div>
              )}
            </div>
          </div>
        )}
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
